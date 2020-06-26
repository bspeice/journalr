import * as vscode from "vscode";
import { TopicDb, TopicEntry, EntryType, Topic, Article } from "../topicdb";

function articleToTreeItem(article: Article): vscode.TreeItem {
  return {
    label: article.title,
    resourceUri: article.uri,
    collapsibleState: vscode.TreeItemCollapsibleState.None,
    description: true,
    contextValue: "journalr.article",
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
    contextValue: "journalr.topic",
  };
}

export class TopicBrowserProvider
  implements vscode.TreeDataProvider<TopicEntry> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TopicEntry | undefined
  > = new vscode.EventEmitter<TopicEntry | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TopicEntry | undefined> = this
    ._onDidChangeTreeData.event;

  constructor(public topicDb: TopicDb) {}

  refresh(topicDb: TopicDb): void {
    this.topicDb = topicDb;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(
    element: TopicEntry
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    switch (element.type) {
      case EntryType.Article:
        return articleToTreeItem(element as Article);

      case EntryType.Topic:
        return topicToTreeItem(element as Topic);

      default:
        throw new Error("Unrecognized topic type");
    }
  }

  getChildren(
    element?: TopicEntry | undefined
  ): vscode.ProviderResult<TopicEntry[]> {
    if (element === undefined) {
      // TODO: Unpack the root if the topics list is only one element
      console.log(`Getting children of root`);
      return this.topicDb.topics;
    }

    if (element.type === EntryType.Topic) {
      const e = element as Topic;
      console.log(`Getting children of ${e.title}`);
      return (element as Topic).entries;
    }

    // Articles don't have children
    return [];
  }
}
