import * as vscode from "vscode";
import { DatabaseWatcher, Topic, TopicDb, Article } from "../topicdb";

function articleToTreeItem(a: Article): vscode.TreeItem {
  return {
    label: a.title,
    resourceUri: a.uri
  }
}

export class BacklinkProvider implements vscode.TreeDataProvider<Article> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Article | undefined
  > = new vscode.EventEmitter<Article | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Article | undefined> = this
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

  getTreeItem(element: Article): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return articleToTreeItem(element);
  }

  // Because backlinks is a flat list, we always operate at "root", and the element is
  // always undefined.
  getChildren(_e?: Article | undefined): vscode.ProviderResult<Article[]> {
    if (this.currentEditor === undefined) {
      return [];
    }

    const currentUri = this.currentEditor.document.uri;

    const currentArticle = this.currentDatabase
      .allArticles()
      .then((articles) =>
        articles.filter((a) => a.uri.fsPath === currentUri.fsPath)
      )
      .then((matches) => (matches.length !== 0 ? matches[0] : undefined))
      .then((a) => {
        return a;
      });

    return currentArticle.then((a) =>
      a !== undefined ? this.currentDatabase.backLinks(a) : []
    );
  }
}
