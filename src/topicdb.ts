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
  entry: Thenable<Topic | Article>;
}

export interface TopicDb {
  topics: Thenable<Topic>[];
}

async function buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Promise<Topic> {
  var entries: TopicEntry[] = [];
  const dirEntries = await vscode.workspace.fs.readDirectory(root);
  for (const [itemName, ft] of dirEntries) {
    const itemUri = vscode.Uri.joinPath(root, itemName);
    if (ft === vscode.FileType.Directory) {
      const topic = buildTopic(itemName, itemUri, false);
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
        entry: Promise.resolve(article),
      });
    }
  }

  return {
    title: name,
    uri: root,
    isRoot: isRootTopic,
    entries: entries,
  };
}

export function workspaceDb(): TopicDb {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  return {
    topics: wsFolders.map((f) => buildTopic(f.name, f.uri, true)),
  };
}
