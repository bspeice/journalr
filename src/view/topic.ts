import * as vscode from "vscode";
import { TopicDb, TopicEntry, EntryType, Topic, Article } from "../topicdb";

function articleToTreeItem(article: Article): vscode.TreeItem {
  return {
    label: article.title,
    resourceUri: article.uri,
    collapsibleState: vscode.TreeItemCollapsibleState.None,
  };
}

function topicToTreeItem(topic: Topic): vscode.TreeItem {
  const collapsibleState = topic.isRoot
    ? vscode.TreeItemCollapsibleState.Expanded
    : vscode.TreeItemCollapsibleState.Collapsed;
  return {
    label: topic.title,
    resourceUri: topic.uri,
    collapsibleState: collapsibleState,
  };
}

export class TopicBrowserProvider
  implements vscode.TreeDataProvider<TopicEntry> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TopicEntry | undefined
  > = new vscode.EventEmitter<TopicEntry | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TopicEntry | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(public topicDb: Thenable<TopicDb>) {}

  refresh(topicDb: Thenable<TopicDb>): void {
    this.topicDb = topicDb;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(
    element: TopicEntry
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    switch (element.type) {
      case EntryType.Article:
        return element.entry.then((e) => articleToTreeItem(e as Article));

      case EntryType.Topic:
        return element.entry.then((e) => topicToTreeItem(e as Topic));

      default:
        throw new Error("Unrecognized topic type");
    }
  }

  getChildren(
    element?: TopicEntry | undefined
  ): vscode.ProviderResult<TopicEntry[]> {
    if (element === undefined) {
      // TODO: This junk needs to get cleaned up.
      return this.topicDb.then((db) => {
        return db.topics.map((t) => {
          return {
            type: EntryType.Topic,
            entry: t
          };
        });
      });
    }

    if (element.type === EntryType.Topic) {
      return element.entry.then((t) => (t as Topic).entries);
    }

    // Articles don't have children
    return [];
  }
}
