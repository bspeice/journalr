import * as vscode from 'vscode';
import { lang } from 'moment';

export interface Item {
    label: string;
    subItems: Item[];
}

export class ExampleTreeProvider implements vscode.TreeDataProvider<Item> {
    onDidChangeTreeData?: vscode.Event<void | Item | null | undefined> | undefined;

    constructor(public tree: Item) {}

    getTreeItem(element: Item): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return Promise.resolve({
            label: element.label,
            collapsibleState: element.subItems.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        });
    }

    getChildren(element?: Item | undefined): vscode.ProviderResult<Item[]> {
        console.log(`getChildren: ${element}`);
        if (element === undefined) {
            return Promise.resolve([this.tree]);
        } else {
            return Promise.resolve(element.subItems);
        }
    }
}

export function exampleTree(): ExampleTreeProvider {
    return new ExampleTreeProvider({
        label: "root",
        subItems: [
            {
                label: "child1",
                subItems: [
                    {
                        label: "grandchild1",
                        subItems: [
                            {
                                label: "grandgrandchild1",
                                subItems: []
                            }
                        ]
                    }
                ]
            }
        ]
    });
}