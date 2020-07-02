import * as marked from "marked";
import * as minimatch from "minimatch";
import * as vscode from "vscode";
import * as utils from "../utils";
import { JournalrConfig } from "../config";
import { FileReader, DirReader } from "../types";

export enum EntryType {
  Topic = 1,
  Article,
}

export interface TopicEntry {
  type: EntryType;
}

function _matches(pattern: vscode.Uri, globs: string[]): boolean {
  const path = vscode.workspace.asRelativePath(pattern);
  return globs.some((g) => minimatch(path, g));
}

function _joinUri(
  name: string,
  root: vscode.Uri,
  ft: vscode.FileType
): [string, vscode.Uri, vscode.FileType] {
  return [name, vscode.Uri.joinPath(root, name), ft];
}

export class Topic implements TopicEntry {
  public type: EntryType;
  private entries: Thenable<TopicEntry[]> | undefined;

  constructor(
    public title: string,
    public uri: vscode.Uri,
    public rootUri: vscode.Uri,
    public ignoreGlobs: string[]
  ) {
    this.type = EntryType.Topic;
  }

  isRoot(): boolean {
    return this.uri.fsPath === this.rootUri.fsPath;
  }

  invalidate() {
    this.entries = undefined;
  }

  getEntries(dirReader: DirReader): Thenable<TopicEntry[]> {
    if (this.entries !== undefined) {
      return this.entries;
    }

    // TODO: I'm seeing some weird issues when not using the `readDirectory` function by name
    const entries = dirReader(this.uri)
      .then((d) => d.map(([name, ft]) => _joinUri(name, this.uri, ft)))
      .then((d) => d.filter(([, uri]) => !_matches(uri, this.ignoreGlobs)))
      .then((dirEntries) => {
        const articles = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.File)
          .map(([, uri]) => Article.fromUri(uri, this.rootUri))
          .reverse();

        const topics = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.Directory)
          .map(([name, uri]) => {
            return new Topic(name, uri, this.rootUri, this.ignoreGlobs);
          })
          .map((t) => Promise.resolve(t)) as Thenable<TopicEntry | undefined>[];

        return Promise.all(topics.concat(articles)).then((entries) =>
          entries.filter((e) => e !== undefined)
        );
      }) as Thenable<TopicEntry[]>;

    this.entries = entries;
    return entries;
  }

  findEntry(dirReader: DirReader, uri: vscode.Uri): Thenable<TopicEntry | undefined> {
    // First, check if it's possible for us to contain this entry
    const thisPathComponents = this.uri.fsPath.split('/');
    const thatPathComponents = uri.fsPath.split('/').slice(0, thisPathComponents.length);

    // WHY THE HELL CAN'T I COMPARE ARRAYS IN JAVASCRIPT???
    if (thisPathComponents.length !== thatPathComponents.length) {
      return Promise.resolve(undefined);
    }
    const isEqual = thisPathComponents.map((v, i) => v === thatPathComponents[i])
      .reduce((acc, v) => acc && v, true);
    if (!isEqual) {
      return Promise.resolve(undefined);
    }

    // For all our entries, if there's a match, return immediately. Otherwise, allow topics
    // to recurse.
    return this.getEntries(dirReader)
    .then((entries) => {
      const toScan = [];
      for (const entry of entries) {
        if (entry.type === EntryType.Article) {
          const e = entry as Article;
          if (e.uri.fsPath === uri.fsPath) {
            return e;
          }
        } else if (entry.type === EntryType.Topic) {
          const e = entry as Topic;
          if (e.uri.fsPath === uri.fsPath) {
            return e;
          }

          toScan.push(e.findEntry(dirReader, uri))
        }
      }

      // We now know everything left to scan; kick off the recursion, and the filter results
      return Promise.all(toScan).then((matches) => {
        for (const match of matches) {
          if (match !== undefined) {
            return match;
          }
        }

        return undefined;
      })
    });
  }

  recurseArticles(dirReader: DirReader): Thenable<Article[]> {
    const entries = this.getEntries(dirReader);

    const articles = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Article)
    ) as Thenable<Article[]>;
    const topics = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Topic)
    ) as Thenable<Topic[]>;

    const topicArticles = topics
      .then((topics) => {
        return Promise.all(topics.map((t) => t.recurseArticles(dirReader)));
      })
      .then((articles) =>
        articles.reduce((acc, a) => acc.concat(a), [])
      ) as Thenable<Article[]>;

    return Promise.all([
      topicArticles,
      articles,
    ]).then(([topicArticles, articles]) => topicArticles.concat(articles));
  }

  recurseTopics(dirReader: DirReader): Thenable<Topic[]> {
    return this.getEntries(dirReader)
      .then((e) => e.filter((e) => e.type === EntryType.Topic) as Topic[])
      .then((topics) => {
        const allTopics = [];
        for (const topic of topics) {
          allTopics.push(Promise.resolve([topic]));
          allTopics.push(topic.recurseTopics(dirReader));
        }
        return Promise.all(allTopics);
      })
      .then((topics) => topics.reduce((acc, t) => acc.concat(t), []));
  }
}

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

function zippedLinks(fileReader: FileReader, article: Article): Thenable<[Article, vscode.Uri][]> {
  return article.getLinks(fileReader).then((links) =>
    links.map((l) => [article, l])
  );
}

export class TopicDb {
  constructor(public topics: Topic[]) {}

  allArticles(dirReader: DirReader): Thenable<Article[]> {
    const articlesPromises = this.topics.map((t) =>
      t.recurseArticles(dirReader)
    );
    const allArticles = Promise.all(articlesPromises);

    return allArticles.then((nested) =>
      nested.reduce((acc, a) => acc.concat(a), [])
    );
  }

  findEntry(dirReader: DirReader, uri: vscode.Uri): Thenable<TopicEntry | undefined> {
    // TODO: More efficient way to handle this besides resolving all promises?
    // We only care about the first match. That said, early returns from topics
    // that know they can't have the element maybe make this less problematic?
    return Promise.all(this.topics.map((t) => t.findEntry(dirReader, uri)))
    .then((matches) => {
      for (const match of matches) {
        if (match !== undefined) {
          return match;
        }
      }
      
      return undefined;
    })
  }

  allTopics(dirReader: DirReader): Thenable<Topic[]> {
    const topicPromises = this.topics.map((t) => {
      return t.recurseTopics(dirReader);
    });
    const allTopics = Promise.all(topicPromises);

    return allTopics
      .then((nested) => nested.reduce((acc, t) => acc.concat(t), []));
  }

  backLinks(
    needle: Article,
    dirReader: DirReader,
    fileReader: FileReader
  ): Thenable<Article[]> {
    const haystack = this.allArticles(dirReader)
      .then((articles) =>
        Promise.all(articles.map((a) => zippedLinks(fileReader, a)))
      )
      .then((vals) => vals.reduce((acc, v) => acc.concat(v)));

    return haystack.then((pairs) => {
      return pairs
        .filter(([, link]) => link.fsPath === needle.uri.fsPath)
        .map(([article]) => article);
    });
  }
}

export interface DatabaseWatcher {
  onRefresh: vscode.Event<TopicDb>;
  currentDb(): TopicDb;
}

export class WorkspaceWatcher implements DatabaseWatcher {
  private database: TopicDb;
  private watcher: vscode.FileSystemWatcher;
  private emitter: vscode.EventEmitter<TopicDb>;

  public onRefresh: vscode.Event<TopicDb>;

  constructor(config: JournalrConfig) {
    // TODO: Add/remove workspace folders
    // TODO: Config updates
    const wsFolders = vscode.workspace.workspaceFolders ?? [];
    const ignore = config.ignoreGlobs;
    const topics = wsFolders.map((f) => {
      return new Topic(f.name, f.uri, f.uri, ignore);
    });
    this.database = new TopicDb(topics);

    this.emitter = new vscode.EventEmitter();
    this.onRefresh = this.emitter.event;

    this.watcher = vscode.workspace.createFileSystemWatcher(
      `**/*.{${utils.MD_EXTENSIONS.join(",")}}`
    );
    this.watcher.onDidChange(this.onDidChange, this);
    this.watcher.onDidCreate(this.onDidCreate, this);
    this.watcher.onDidDelete(this.onDidDelete, this);
  }

  currentDb(): TopicDb {
    return this.database;
  }

  onDidChange(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }

  onDidCreate(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }

  onDidDelete(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }
}
