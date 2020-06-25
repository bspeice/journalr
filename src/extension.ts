import * as vscode from "vscode";
import { JournalrConfig } from "./config";

import { insertAttachment, insertImage } from "./command/attachment";
import { menuCreateNote, menuCopyId } from "./command/explorer";
import { createJournal } from "./command/journal";
import * as topicBrowser from "./command/topic_browser";
import { TopicBrowserProvider } from "./view/topic";

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
      "journalr.topicBrowser.refresh",
      topicBrowser.refresh
    )
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

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.topicBrowser",
      new TopicBrowserProvider()
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
