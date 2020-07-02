import * as vscode from "vscode";
import {
  TopicDb,
  TopicEntry,
  EntryType,
  Topic,
  Article,
  DatabaseWatcher,
  WorkspaceWatcher,
} from "../topicdb";
import { VSC_DIRREADER } from "../types";

async function articleToTreeItem(article: Article): Promise<vscode.TreeItem> {
  return {
    label: article.title,
    resourceUri: article.uri,
    collapsibleState: vscode.TreeItemCollapsibleState.None,
    description: true,
    contextValue: "journalr.article",
    command: {
      title: "Show Article",
      command: "journalr.topicBrowser.showArticle",
      arguments: [article],
    },
  };
}

function topicToTreeItem(topic: Topic): vscode.TreeItem {
  const collapsibleState = topic.isRoot()
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

  private topicDb: TopicDb;

  constructor(watcher: DatabaseWatcher) {
    this.topicDb = watcher.currentDb();
    watcher.onRefresh(this.refresh, this);
  }

  refresh(topicDb?: TopicDb): void {
    if (topicDb !== undefined) {
      this.topicDb = topicDb;
    }
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
      const topics = this.topicDb.topics;
      if (topics.length === 1) {
        return this.topicDb.topics[0].getEntries(VSC_DIRREADER);
      }

      return topics;
    }

    if (element.type === EntryType.Topic) {
      const e = element as Topic;
      return e.getEntries(VSC_DIRREADER);
    }

    // Articles don't have children
    return [];
  }
}

export function register(
  context: vscode.ExtensionContext,
  workspaceWatcher: WorkspaceWatcher
): TopicBrowserProvider {
  const topicProvider = new TopicBrowserProvider(workspaceWatcher);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.topicBrowser",
      topicProvider
    )
  );

  return topicProvider;
}
