import * as vscode from "vscode";
import { TopicDb, TopicEntry, EntryType, Topic, Article } from "../topicdb";

function articleToTreeItem(article: Article): vscode.TreeItem {
  return {
    label: article.title,
    resourceUri: article.uri,
    collapsibleState: vscode.TreeItemCollapsibleState.None,
    description: true,
    contextValue: "topicBrowser.article",
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
    contextValue: "topicBrowser.topic",
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
        return articleToTreeItem(element.entry as Article);

      case EntryType.Topic:
        return topicToTreeItem(element.entry as Topic);

      default:
        throw new Error("Unrecognized topic type");
    }
  }

  getChildren(
    element?: TopicEntry | undefined
  ): vscode.ProviderResult<TopicEntry[]> {
    if (element === undefined) {
      // TODO: Clean up this junk
      return this.topicDb.topics.then((topics) => {
        if (topics.length === 1) {
          return topics[0].entries;
        }

        return topics.map((t) => {
          return {
            type: EntryType.Topic,
            entry: t,
          };
        });
      });
    }

    if (element.type === EntryType.Topic) {
      return (element.entry as Topic).entries;
    }

    // Articles don't have children
    return [];
  }
}
