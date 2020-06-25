import * as vscode from 'vscode';

class Topic extends vscode.TreeItem {

}

export class TopicBrowserProvider implements vscode.TreeDataProvider<Topic> {

    onDidChangeTreeData?: vscode.Event<void | Topic | null | undefined> | undefined;

    getTreeItem(element: Topic): vscode.TreeItem | Thenable<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }

    getChildren(element?: Topic | undefined): vscode.ProviderResult<Topic[]> {
        throw new Error("Method not implemented.");
    }
}