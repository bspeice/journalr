import * as marked from "marked";
import * as vscode from "vscode";
import * as utils from "../utils";
import { TopicEntry, EntryType, Topic } from ".";
import { relative } from "path";

function getLinks(t: marked.Token): string[] {
  var links = [];
  if ("href" in t) {
    links.push(t.href);
  }

  if ("tokens" in t && t.tokens !== undefined) {
    for (const subT of t.tokens) {
      for (const l of getLinks(subT)) {
        links.push(l);
      }
    }
  }

  if ("items" in t && t.items !== undefined) {
    for (const item of t.items) {
      for (const l of getLinks(item)) {
        links.push(l);
      }
    }
  }

  return links;
}

function isArticleLink(l: string | null): boolean {
  if (l === null) {
    return false;
  } else if (l.length === 0) {
    return false;
  } else if (l[0] !== "/") {
    // NOTE: This skips over a *lot* of true positives
    // Relative internal linking is definitely a thing.
    return false;
  }

  return true;
}

export function readMdTitle(
  fs: vscode.FileSystem,
  uri: vscode.Uri,
  uriRoot: vscode.Uri
): Thenable<string> {
  // If the document contains a `# ` as the first characters, treat that as the title.
  // Otherwise, just use the `basename`.
  return fs.readFile(uri).then((content) => {
    if (content.length > 2 && content.slice(0, 2).toString() === "# ") {
      const lineEnd = content.findIndex((c) => c === "\n".charCodeAt(0));
      return content.slice(2, lineEnd).toString();
    }

    return relative(uriRoot.fsPath, uri.fsPath);
  });
}

export class Article implements TopicEntry {
  public type: EntryType;
  private articleLinks: Thenable<vscode.Uri[]> | undefined;

  constructor(
    public title: string,
    public uri: vscode.Uri,
    public rootUri: vscode.Uri,
    public parent: Topic
  ) {
    this.type = EntryType.Article;
  }

  getLinks(fs: vscode.FileSystem): Thenable<vscode.Uri[]> {
    if (this.articleLinks !== undefined) {
      return Promise.resolve(this.articleLinks);
    }

    const links = fs
      .readFile(this.uri)
      .then((text) => {
        const tokens = marked.lexer(text.toString());
        const inlineLinks = tokens
          .map(getLinks)
          .reduce((acc, i) => acc.concat(i), [])
          .filter(isArticleLink);

        const freestandingLinks = Object.entries(tokens.links)
          .map(([, link]) => link.href)
          .filter(isArticleLink)
          .filter((l) => l !== null) as string[];

        const toUri = (l: string): vscode.Uri => {
          const decoded = decodeURI(l);
          // NOTE: This assumes the decoded link is absolute.
          return vscode.Uri.joinPath(this.rootUri, decoded);
        };
        return inlineLinks.concat(freestandingLinks).map(toUri);
      })
      .then((links) => links.filter((l) => l !== undefined)) as Thenable<
      vscode.Uri[]
    >;

    this.articleLinks = links;
    return links;
  }

  invalidate() {
    this.articleLinks = undefined;
  }

  static fromUri(
    fs: vscode.FileSystem,
    uri: vscode.Uri,
    rootUri: vscode.Uri,
    topic: Topic
  ): Thenable<Article | undefined> {
    const isFile = fs.stat(uri).then((s) => s.type === vscode.FileType.File);

    const title = isFile.then((isFile) => {
      if (!isFile) {
        return undefined;
      }

      const extension = uri.path.split(".").reverse()[0];
      if (!utils.MD_EXTENSIONS.includes(extension)) {
        return undefined;
      }

      return readMdTitle(fs, uri, rootUri);
    });

    return title.then((title) => {
      if (title === undefined) {
        return undefined;
      }

      return new Article(title, uri, rootUri, topic);
    });
  }
}
