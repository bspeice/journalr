import * as marked from 'marked';
import * as vscode from 'vscode';
import * as utils from '../utils';
import { TopicEntry, EntryType } from ".";
import { FileReader } from '../types';

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

export class Article implements TopicEntry {
  public type: EntryType;
  // NOTE: We don't care about tracking external links here, this is only for internal article links.
  private links: Thenable<vscode.Uri[]> | undefined;

  constructor(
    public title: string,
    public uri: vscode.Uri,
    public rootUri: vscode.Uri
  ) {
    this.type = EntryType.Article;
  }

  getLinks(fileReader: FileReader): Thenable<vscode.Uri[]> {
    if (this.links !== undefined) {
      return Promise.resolve(this.links);
    }

    // TODO: Getting some weird errors when not referring to `readFile` by name
    const links = fileReader(this.uri)
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
          return vscode.Uri.joinPath(this.rootUri, decoded);
        };
        return inlineLinks.concat(freestandingLinks).map(toUri);
      })
      .then((links) => links.filter((l) => l !== undefined)) as Thenable<
      vscode.Uri[]
    >;

    this.links = links;
    return links;
  }

  invalidate() {
    this.links = undefined;
  }

  static fromUri(
    uri: vscode.Uri,
    rootUri: vscode.Uri
  ): Thenable<Article | undefined> {
    const extension = uri.path.split(".").reverse()[0];
    if (!utils.MD_EXTENSIONS.includes(extension)) {
      return Promise.resolve(undefined);
    }

    return utils.noteTitle(uri).then((name) => {
      if (name === undefined) {
        return undefined;
      }

      return new Article(name, uri, rootUri);
    });
  }
}