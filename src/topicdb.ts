import * as vscode from "vscode";
import * as utils from "./utils";

export enum EntryType {
  Topic = 1,
  Article,
}

export interface TopicEntry {
  type: EntryType;
}

export class Topic implements TopicEntry {
  public type: EntryType;

  constructor(
    public title: string,
    public uri: vscode.Uri,
    public isRoot: boolean
  ) {
    this.type = EntryType.Topic;
  }

  getEntries(): Thenable<TopicEntry[]> {
    const res = vscode.workspace.fs
      .readDirectory(this.uri)
      .then((dirEntries) => dirEntries.reverse())
      .then((dirEntries) => {
        const articlePromises = dirEntries
          .filter(([_, ft]) => ft === vscode.FileType.File)
          .map(([name, _]) => name)
          .map((name) => vscode.Uri.joinPath(this.uri, name))
          .map((uri) => Article.fromUri(uri));

        const topics = dirEntries
          .filter(([_, ft]) => ft === vscode.FileType.Directory)
          .map(([name, _]) => name)
          .map((name) => {
            return new Topic(name, vscode.Uri.joinPath(this.uri, name), false);
          });

        return Promise.all(articlePromises)
          .then(
            (articles) =>
              articles.filter((a) => a !== undefined) as TopicEntry[]
          )
          .then((articles) => articles.concat(topics));
      });

    return res;
  }
}

export class Article implements TopicEntry {
  public type: EntryType;

  constructor(public title: string, public uri: vscode.Uri) {
    this.type = EntryType.Article;
  }

  static fromUri(uri: vscode.Uri): Thenable<Article | undefined> {
    return utils.noteTitle(uri).then((name) => {
      if (name === undefined) {
        return undefined;
      }

      return new Article(name, uri);
    });
  }
}

export interface TopicDb {
  topics: Topic[];
}

export function workspaceDb(): TopicDb {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  const topics = wsFolders.map((f) => {
    return new Topic(f.name, f.uri, true);
  });

  return {
    topics: topics,
  };
}
