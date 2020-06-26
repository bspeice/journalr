import * as vscode from "vscode";
import * as utils from './utils';

export enum EntryType {
  Topic = 1,
  Article,
}

export interface Topic {
  title: string;
  uri: vscode.Uri;
  isRoot: boolean;
  entries: Thenable<TopicEntry[]>;
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
  topics: Thenable<TopicEntry[]>;
}

async function buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Promise<Topic> {
  console.log(`Building topic ${root}`);

  var entries = [];
  const dirEntries = await vscode.workspace.fs.readDirectory(root);
  for (const [itemName, ft] of dirEntries) {
    const itemUri = vscode.Uri.joinPath(root, itemName);
    if (ft === vscode.FileType.Directory) {
      const topic = buildTopic(itemName, itemUri, false);
      const entry = topic.then((t) => {
        return {
          type: EntryType.Topic,
          entry: t,
        };
      });
      entries.push(entry);
    } else if (ft === vscode.FileType.File) {
      const title = await utils.noteTitle(itemUri);
      if (title === undefined) {
        continue;
      }

      const article = {
        title: title,
        uri: itemUri,
      };
      const entry = {
        type: EntryType.Article,
        entry: article,
      };
      entries.push(Promise.resolve(entry));
    }
  }

  return {
    title: name,
    uri: root,
    isRoot: isRootTopic,
    entries: Promise.all(entries),
  };
}

export function workspaceDb(): TopicDb {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  const rootTopics = wsFolders.map((f) => buildTopic(f.name, f.uri, true));
  const allEntries = Promise.all(rootTopics).then((topics) => {
    var entries = [];
    for (const topic of topics) {
      entries.push({
        type: EntryType.Topic,
        entry: topic
      });
    }

    return entries;
  });

  return {
    topics: allEntries
  };
}
