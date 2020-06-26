import * as vscode from "vscode";
import { JournalrConfig } from "./config";

import { insertAttachment, insertImage } from "./command/attachment";
import { menuCreateNote, menuCopyId } from "./command/explorer";
import { createJournal } from "./command/journal";
import { TopicBrowserProvider } from "./view/topic";
import { workspaceDb } from "./topicdb";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.createJournal", () => {
      createJournal(JournalrConfig.fromConfig());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.insertAttachment",
      insertAttachment
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.insertImage", () => {
      insertImage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.createNote",
      (fileUri: vscode.Uri) => {
        menuCreateNote(fileUri, JournalrConfig.fromConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.copyId",
      (fileUri: vscode.Uri) => {
        menuCopyId(fileUri, JournalrConfig.fromConfig());
      }
    )
  );

  const topicProvider = new TopicBrowserProvider(
    Promise.resolve(workspaceDb())
  );
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.topicBrowser",
      topicProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.topicBrowser.refresh", () => {
      topicProvider.refresh(Promise.resolve(workspaceDb()));
    })
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
