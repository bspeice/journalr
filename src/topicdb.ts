import * as vscode from "vscode";
import * as utils from "./utils";
import { dir } from "console";

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
    return Promise.resolve([]);
  }
}

export class Article implements TopicEntry {
  public type: EntryType;

  constructor(public title: string, public uri: vscode.Uri) {
    this.type = EntryType.Article;
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
