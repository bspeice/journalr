import * as vscode from "vscode";
import { Article, TopicDb, DatabaseWatcher, EntryType } from "../topicdb";
import { ConfigWatcher, JournalrConfig } from "../config";

enum ArticleTagType {
  Tag = 1,
  Article,
}

class ArticleTagElement {
  private constructor(
    public type: ArticleTagType,
    public element: Article | string
  ) {
    if (
      (type === ArticleTagType.Tag && typeof element !== "string") ||
      (type === ArticleTagType.Article && typeof element !== "object")
    ) {
      throw new Error("Unexpected element type");
    }
  }

  static fromArticle(a: Article): ArticleTagElement {
    return new ArticleTagElement(ArticleTagType.Article, a);
  }

  static fromTag(t: string): ArticleTagElement {
    return new ArticleTagElement(ArticleTagType.Tag, t);
  }

  toTreeItem(): vscode.TreeItem {
    if (this.type === ArticleTagType.Tag) {
      return {
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
        contextValue: "journalr.articleTags.tag",
        label: this.element as string,
      };
    } else {
      const a = this.element as Article;
      return {
        label: a.title,
        resourceUri: a.rootUri,
        contextValue: "journalr.articleTags.article",
        command: {
          title: "Show Article",
          command: "journalr.articleTags.showArticle",
          arguments: [a],
        },
      };
    }
  }
}

class ArticleTagProvider implements vscode.TreeDataProvider<ArticleTagElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ArticleTagElement | undefined
  > = new vscode.EventEmitter<ArticleTagElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    ArticleTagElement | undefined
  > = this._onDidChangeTreeData.event;

  private currentEditor: vscode.TextEditor | undefined;
  private currentDatabase: TopicDb;
  private currentConfig: JournalrConfig;

  constructor(dbWatcher: DatabaseWatcher, configWatcher: ConfigWatcher) {
    this.currentEditor = vscode.window.activeTextEditor;
    vscode.window.onDidChangeActiveTextEditor(this.refreshEditor, this);

    this.currentDatabase = dbWatcher.currentDb();
    dbWatcher.onRefresh(this.refreshDb, this);

    this.currentConfig = configWatcher.currentConfig();
    configWatcher.onChange(this.refreshConfig, this);
  }

  refreshDb(topicDb: TopicDb) {
    this.currentDatabase = topicDb;
    this._onDidChangeTreeData.fire(undefined);
  }

  refreshEditor(editor: vscode.TextEditor | undefined) {
    this.currentEditor = editor;
    this._onDidChangeTreeData.fire(undefined);
  }

  refreshConfig(config: JournalrConfig) {
    this.currentConfig = config;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(
    e: ArticleTagElement
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return e.toTreeItem();
  }

  getChildren(
    e?: ArticleTagElement | undefined
  ): vscode.ProviderResult<ArticleTagElement[]> {
    if (e === undefined) {
      // Root level, fetch all tags in the current article
      if (this.currentEditor === undefined) {
        return [];
      }

      const uri = this.currentEditor.document.uri;

      return this.currentDatabase
        .findEntry(vscode.workspace.fs, uri)
        .then((a) => {
          if (a === undefined || a.type === EntryType.Topic) {
            return [];
          }

          const article = a as Article;
          return article.getTags(
            vscode.workspace.fs,
            this.currentConfig.tagPrefix
          );
        })
        .then((tags) => {
          return tags.map(ArticleTagElement.fromTag);
        });
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
): ArticleTagProvider {
  const tagProvider = new ArticleTagProvider(databaseWatcher, configWatcher);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("journalr.articleTags", tagProvider)
  );

  return tagProvider;
}
