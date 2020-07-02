import * as vscode from "vscode";
import { DatabaseWatcher, TopicDb, Article } from "../topicdb";
import { VSC_DIRREADER, VSC_FILEREADER } from "../types";

export enum BacklinkElementType {
  Backlink = 1,
  ForwardLink = 2,
  Article = 3,
}

export class BacklinkElement {
  constructor(public type: BacklinkElementType, public article?: Article) {
    if (type === BacklinkElementType.Article && article === undefined) {
      throw new Error("Invalid backlink element");
    }
  }

  toTreeItem(): vscode.TreeItem {
    if (this.type === BacklinkElementType.Backlink) {
      return {
        label: "Backlinks",
        collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
      };
    } else if (this.type === BacklinkElementType.ForwardLink) {
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

  static fromArticle(a: Article): BacklinkElement {
    return new BacklinkElement(BacklinkElementType.Article, a);
  }
}

const BACKLINK = new BacklinkElement(BacklinkElementType.Backlink);
const FORWARD_LINK = new BacklinkElement(BacklinkElementType.ForwardLink);

export class BacklinkProvider
  implements vscode.TreeDataProvider<BacklinkElement> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    BacklinkElement | undefined
  > = new vscode.EventEmitter<BacklinkElement | undefined>();
  readonly onDidChangeTreeData: vscode.Event<BacklinkElement | undefined> = this
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
    element: BacklinkElement
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element.toTreeItem();
  }

  getChildren(
    e?: BacklinkElement | undefined
  ): vscode.ProviderResult<BacklinkElement[]> {
    if (e === undefined) {
      return [BACKLINK, FORWARD_LINK];
    } else if (e.type === BacklinkElementType.Article) {
      return [];
    }

    if (this.currentEditor === undefined) {
      return [];
    }
    const currentUri = this.currentEditor.document.uri;

    const currentArticle = this.currentDatabase
      .allArticles(VSC_DIRREADER)
      .then((articles) =>
        articles.filter((a) => a.uri.fsPath === currentUri.fsPath)
      )
      .then((matches) => (matches.length !== 0 ? matches[0] : undefined))
      .then((a) => {
        return a;
      });

    return currentArticle.then((a) => {
      if (a === undefined) {
        return [];
      }

      if (e.type === BacklinkElementType.ForwardLink) {
        const articles = a
          .getLinks(VSC_FILEREADER)
          .then((links) => {
            return Promise.all(links.map((l) => Article.fromUri(l, a.rootUri)));
          })
          .then((articles) =>
            articles.filter((a) => a !== undefined)
          ) as Thenable<Article[]>;

        return articles.then((articles) =>
          articles.map((a) => BacklinkElement.fromArticle(a))
        );
      }

      // Backlinks
      return this.currentDatabase
        .backLinks(a, VSC_DIRREADER, VSC_FILEREADER)
        .then((articles) =>
          articles.map((a) => BacklinkElement.fromArticle(a))
        );
    });
  }
}

export function register(
  context: vscode.ExtensionContext,
  databaseWatcher: DatabaseWatcher
): BacklinkProvider {
  const backlinkProvider = new BacklinkProvider(databaseWatcher);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.articleLinks",
      backlinkProvider
    )
  );

  return backlinkProvider;
}
