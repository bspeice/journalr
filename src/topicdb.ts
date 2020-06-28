import * as vscode from "vscode";
import * as utils from "./utils";
import * as minimatch from "minimatch";
import { JournalrConfig } from "./config";
import { min } from "moment";

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
    public isRoot: boolean,
    public ignoreGlobs: string[]
  ) {
    this.type = EntryType.Topic;
  }

  getEntries(): Thenable<TopicEntry[]> {
    if (this.entries !== undefined) {
      return this.entries;
    }

    const entries = vscode.workspace.fs
      .readDirectory(this.uri)
      .then((d) => d.map(([name, ft]) => _joinUri(name, this.uri, ft)))
      .then((d) => d.filter(([, uri]) => !_matches(uri, this.ignoreGlobs)))
      .then((dirEntries) => {
        const articles = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.File)
          .map(([, uri]) => Article.fromUri(uri))
          .reverse();

        const topics = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.Directory)
          .map(([name, uri]) => {
            return new Topic(name, uri, false, this.ignoreGlobs);
          })
          .map((t) => Promise.resolve(t)) as Thenable<TopicEntry | undefined>[];

        return Promise.all(topics.concat(articles)).then((entries) =>
          entries.filter((e) => e !== undefined)
        );
      }) as Thenable<TopicEntry[]>;

    this.entries = entries;
    return entries;
  }

  recurseArticles(): Thenable<Article[]> {
    const entries = this.getEntries();

    const articles = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Article)
    ) as Thenable<Article[]>;
    const topics = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Topic)
    ) as Thenable<Topic[]>;

    const topicArticles = topics
      .then((topics) => {
        return Promise.all(topics.map((t) => t.recurseArticles()));
      })
      .then((articles) =>
        articles.reduce((acc, a) => acc.concat(a), [])
      ) as Thenable<Article[]>;

    return Promise.all([
      topicArticles,
      articles,
    ]).then(([topicArticles, articles]) => topicArticles.concat(articles));
  }
}

const _MD_FILETYPES = ["md"];

export class Article implements TopicEntry {
  public type: EntryType;

  constructor(public title: string, public uri: vscode.Uri) {
    this.type = EntryType.Article;
  }

  static fromUri(uri: vscode.Uri): Thenable<Article | undefined> {
    const extension = uri.path.split(".").reverse()[0];
    if (!_MD_FILETYPES.includes(extension)) {
      return Promise.resolve(undefined);
    }

    return utils.noteTitle(uri).then((name) => {
      if (name === undefined) {
        return undefined;
      }

      return new Article(name, uri);
    });
  }
}

export class TopicDb {
  constructor(public topics: Topic[]) {}

  allArticles(): Thenable<Article[]> {
    return Promise.resolve([]);
  }
}
export interface TopicDb {
  topics: Topic[];
}

export function workspaceDb(): TopicDb {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  const ignore = JournalrConfig.fromConfig().ignoreGlobs;
  const topics = wsFolders.map((f) => {
    return new Topic(f.name, f.uri, true, ignore);
  });

  return new TopicDb(topics);
}
