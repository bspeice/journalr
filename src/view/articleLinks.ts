import * as vscode from "vscode";
import { DatabaseWatcher, TopicDb, EntryType, Article } from "../topicdb";

export enum ArticleLinkType {
  Backlink = 1,
  ForwardLink = 2,
  Article = 3,
}

export class ArticleLinkElement {
  constructor(public type: ArticleLinkType, public article?: Article) {
    if (type === ArticleLinkType.Article && article === undefined) {
      throw new Error("Invalid backlink element");
    }
  }

  toTreeItem(): vscode.TreeItem {
    if (this.type === ArticleLinkType.Backlink) {
      return {
        label: "Backlinks",
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      };
    } else if (this.type === ArticleLinkType.ForwardLink) {
      return {
        label: "Forward Links",
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      };
    }

    if (this.article === undefined) {
      throw new Error("Invalid backlink element");
    }

    return {
      label: this.article.title,
      resourceUri: this.article.uri,
      contextValue: "journalr.article",
      command: {
        title: "Show Article",
        command: "journalr.topicBrowser.showArticle",
        arguments: [this.article],
      },
    };
  }

  static fromArticle(a: Article): ArticleLinkElement {
    return new ArticleLinkElement(ArticleLinkType.Article, a);
  }
}

const BACKLINK = new ArticleLinkElement(ArticleLinkType.Backlink);
const FORWARD_LINK = new ArticleLinkElement(ArticleLinkType.ForwardLink);

export class ArticleLinkProvider
  implements vscode.TreeDataProvider<ArticleLinkElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ArticleLinkElement | undefined
  > = new vscode.EventEmitter<ArticleLinkElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ArticleLinkElement | undefined> = this
    ._onDidChangeTreeData.event;

  private currentEditor: vscode.TextEditor | undefined;
  private currentDatabase: TopicDb;

  constructor(dbWatcher: DatabaseWatcher) {
    this.currentEditor = vscode.window.activeTextEditor;
    vscode.window.onDidChangeActiveTextEditor(this.refreshEditor, this);

    this.currentDatabase = dbWatcher.currentDb();
    dbWatcher.onRefresh(this.refreshDb, this);
  }

  refreshDb(topicDb: TopicDb) {
    this.currentDatabase = topicDb;
    this._onDidChangeTreeData.fire(undefined);
  }

  refreshEditor(editor: vscode.TextEditor | undefined) {
    this.currentEditor = editor;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(
    element: ArticleLinkElement
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element.toTreeItem();
  }

  getChildren(
    e?: ArticleLinkElement | undefined
  ): vscode.ProviderResult<ArticleLinkElement[]> {
    if (e === undefined) {
      return [BACKLINK, FORWARD_LINK];
    } else if (e.type === ArticleLinkType.Article) {
      return [];
    }

    if (this.currentEditor === undefined) {
      return [];
    }

    const currentUri = this.currentEditor.document.uri;
    const currentArticle = this.currentDatabase.findEntry(vscode.workspace.fs, currentUri)
    .then((e) => {
      if (e !== undefined && e.type === EntryType.Article) {
        return e as Article;
      }

      return undefined;
    });

    return currentArticle.then((a) => {
      if (a === undefined) {
        return [];
      }

      if (e.type === ArticleLinkType.ForwardLink) {
        const articles = a
          .getLinks(vscode.workspace.fs)
          .then((links) => {
            return Promise.all(links.map((l) => this.currentDatabase.findEntry(vscode.workspace.fs, l)));
          })
          .then((articles) =>
            articles.filter((a) => a !== undefined)
          ) as Thenable<Article[]>;

        return articles.then((articles) =>
          articles.map((a) => ArticleLinkElement.fromArticle(a))
        );
      }

      // Backlinks
      return this.currentDatabase
        .backLinks(vscode.workspace.fs, a)
        .then((articles) =>
          articles.map((a) => ArticleLinkElement.fromArticle(a))
        );
    });
  }
}

export function register(
  context: vscode.ExtensionContext,
  databaseWatcher: DatabaseWatcher
): ArticleLinkProvider {
  const backlinkProvider = new ArticleLinkProvider(databaseWatcher);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.articleLinks",
      backlinkProvider
    )
  );

  return backlinkProvider;
}
