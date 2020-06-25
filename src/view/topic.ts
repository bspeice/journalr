import * as vscode from "vscode";
import { TopicDb } from "../topicdb";

class Topic extends vscode.TreeItem {}

export class TopicBrowserProvider implements vscode.TreeDataProvider<Topic> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    Topic | undefined
  > = new vscode.EventEmitter<Topic | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Topic | undefined> = this
    ._onDidChangeTreeData.event;

  dbRetriever: () => Promise<TopicDb>;

  constructor(dbRetriever: () => Promise<TopicDb>) {
    this.dbRetriever = dbRetriever;
  }

  refresh(): void {
    vscode.window.showInformationMessage("Refreshing");
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: Topic): vscode.TreeItem | Thenable<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }

  getChildren(element?: Topic | undefined): vscode.ProviderResult<Topic[]> {
    throw new Error("Method not implemented.");
  }
}
