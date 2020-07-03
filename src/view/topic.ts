import * as vscode from "vscode";
import {
  TopicDb,
  TopicEntry,
  EntryType,
  DatabaseWatcher,
  WorkspaceWatcher,
  Article,
  Topic,
} from "../topicdb";
import { VSC_DIRREADER, VSC_STAT, VSC_FILEREADER } from "../types";

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

function topicToTreeItem(
  topic: Topic,
  collapseTracker: CollapseTracker
): vscode.TreeItem {
  const collapsibleState = collapseTracker.currentState(topic);
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

  constructor(
    watcher: DatabaseWatcher,
    public collapseTracker: CollapseTracker
  ) {
    this.topicDb = watcher.currentDb();
    watcher.onRefresh(this.refresh, this);
  }

  refresh(topicDb?: TopicDb): void {
    if (topicDb !== undefined) {
      this.topicDb = topicDb;
    } else {
      for (const topic of this.topicDb.topics) {
        topic.invalidate();
      }
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
        return topicToTreeItem(element as Topic, this.collapseTracker);

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
        return this.topicDb.topics[0].getEntries(VSC_FILEREADER, VSC_DIRREADER, VSC_STAT);
      }

      return topics;
    }

    if (element.type === EntryType.Topic) {
      const e = element as Topic;
      return e.getEntries(VSC_FILEREADER, VSC_DIRREADER, VSC_STAT);
    }

    // Articles don't have children
    return [];
  }

  onDidCollapseElement(event: vscode.TreeViewExpansionEvent<TopicEntry>) {
    const e = event.element;
    if (e.type !== EntryType.Topic) {
      return;
    }

    const topic = e as Topic;
    this.collapseTracker.collapse(topic);
  }

  onDidExpandElement(event: vscode.TreeViewExpansionEvent<TopicEntry>) {
    const e = event.element;
    if (e.type !== EntryType.Topic) {
      return;
    }

    const topic = e as Topic;
    this.collapseTracker.expand(topic);
  }
}

const TOPIC_STATE_KEY = "journalr.topicBrowser.expandedTopics";

export class CollapseTracker {
  private expanded: Set<string>;

  constructor(private workspaceState: vscode.Memento) {
    const allItems: string[] = workspaceState.get(TOPIC_STATE_KEY) ?? [];
    this.expanded = new Set(allItems);
  }

  private writeState() {
    // TODO: Is there a better way than create a new array every time?
    const allExpanded: string[] = [];
    this.expanded.forEach((v) => allExpanded.push(v));
    this.workspaceState.update(TOPIC_STATE_KEY, allExpanded);
  }

  collapse(t: Topic) {
    this.expanded.delete(t.uri.fsPath);
    this.writeState();
  }

  expand(t: Topic) {
    this.expanded.add(t.uri.fsPath);
    this.writeState();
  }

  currentState(t: Topic): vscode.TreeItemCollapsibleState {
    if (t.uri.fsPath === t.rootUri.fsPath) {
      return vscode.TreeItemCollapsibleState.Expanded;
    }

    return this.expanded.has(t.uri.path)
      ? vscode.TreeItemCollapsibleState.Expanded
      : vscode.TreeItemCollapsibleState.Collapsed;
  }
}

export function register(
  context: vscode.ExtensionContext,
  workspaceWatcher: WorkspaceWatcher
): TopicBrowserProvider {
  const collapseTracker = new CollapseTracker(context.workspaceState);
  const topicProvider = new TopicBrowserProvider(
    workspaceWatcher,
    collapseTracker
  );
  const treeView = vscode.window.createTreeView("journalr.topicBrowser", {
    treeDataProvider: topicProvider,
    showCollapseAll: true,
    canSelectMany: false,
  });

  treeView.onDidCollapseElement(
    topicProvider.onDidCollapseElement,
    topicProvider
  );
  treeView.onDidExpandElement(topicProvider.onDidExpandElement, topicProvider);

  context.subscriptions.push(treeView);
  return topicProvider;
}
