import * as vscode from "vscode";
import { ArticleTagType, ArticleTagElement } from "./articleTags";
import { TopicDb, DatabaseWatcher, EntryType, Article } from "../topicdb";
import { JournalrConfig, ConfigWatcher } from "../config";

class TagBrowserProvider implements vscode.TreeDataProvider<ArticleTagElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ArticleTagElement | undefined
  > = new vscode.EventEmitter<ArticleTagElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    ArticleTagElement | undefined
  > = this._onDidChangeTreeData.event;

  private currentDatabase: TopicDb;
  private currentConfig: JournalrConfig;

  constructor(dbWatcher: DatabaseWatcher, configWatcher: ConfigWatcher) {
    this.currentDatabase = dbWatcher.currentDb();
    dbWatcher.onRefresh(this.refreshDb, this);

    this.currentConfig = configWatcher.currentConfig();
    configWatcher.onChange(this.refreshConfig, this);
  }

  refreshDb(topicDb: TopicDb) {
    this.currentDatabase = topicDb;
    this._onDidChangeTreeData.fire(undefined);
  }

  refreshConfig(config: JournalrConfig) {
    this.currentConfig = config;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(
    e: ArticleTagElement
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    // TODO: Change the context value prefix from "journal.articleTags"
    return e.toTreeItem();
  }

  getChildren(
    e?: ArticleTagElement | undefined
  ): vscode.ProviderResult<ArticleTagElement[]> {
    if (e === undefined) {
      // Root level, fetch all tags
      return this.currentDatabase
        .allTags(vscode.workspace.fs, this.currentConfig.tagPrefix)
        .then((tags) => tags.map((t) => ArticleTagElement.fromTag(t)));
    } else if (e.type === ArticleTagType.Article) {
      // Articles have no children
      return [];
    } else {
      // `e` is a tag, get all articles that contain it
      return this.currentDatabase
        .tagged(
          vscode.workspace.fs,
          e.element as string,
          this.currentConfig.tagPrefix
        )
        .then((articles) => articles.map(ArticleTagElement.fromArticle));
    }
  }
}

export function register(
  context: vscode.ExtensionContext,
  databaseWatcher: DatabaseWatcher,
  configWatcher: ConfigWatcher
): TagBrowserProvider {
  const tagProvider = new TagBrowserProvider(databaseWatcher, configWatcher);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("journalr.tagBrowser", tagProvider)
  );

  return tagProvider;
}
