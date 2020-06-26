import * as vscode from "vscode";

export enum EntryType {
  Topic = 1,
  Article,
}

export interface Topic {
  title: string;
  uri: vscode.Uri;
  isRoot: boolean;
  entries: TopicEntry[];
}

export interface Article {
  title: string;
  uri: vscode.Uri;
}

export interface TopicEntry {
  type: EntryType;
  entry: Topic | Article;
}

export interface TopicDb {
  topics: TopicEntry[];
}

async function buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Promise<Topic> {
  var entries = [];
  for await (const [itemName, ft] of await vscode.workspace.fs.readDirectory(
    root
  )) {
    const itemUri = vscode.Uri.joinPath(root, itemName);
    if (ft === vscode.FileType.Directory) {
      const topic = await buildTopic(itemName, itemUri, false);
      entries.push({
        type: EntryType.Topic,
        entry: topic,
      });
    } else if (ft === vscode.FileType.File) {
      const article = {
        title: itemName,
        uri: itemUri,
      };
      entries.push({
        type: EntryType.Article,
        entry: article,
      });
    }
  }

  return {
    title: name,
    uri: root,
    entries: entries,
    isRoot: isRootTopic,
  };
}

export async function workspaceDb(): Promise<TopicDb> {
  var topics = [];

  for (const wsFolder of vscode.workspace.workspaceFolders ?? []) {
    const rootTopic = await buildTopic(wsFolder.name, wsFolder.uri, true);
    topics.push({
      type: EntryType.Topic,
      entry: rootTopic,
    });
  }
  return { topics: topics };
}
