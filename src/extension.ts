import * as vscode from "vscode";
import { JournalrConfig } from "./config";

import { insertAttachment, insertImage } from "./command/attachment";
import { menuCreateNote, menuCopyId } from "./command/explorer";
import { createJournal } from "./command/journal";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.createJournal", () => {
      createJournal(JournalrConfig.fromConfig());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.insertAttachment", () => {
      insertAttachment();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.insertImage", () => {
      insertImage();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorerContextCreateNote",
      (fileUri: vscode.Uri) => {
        menuCreateNote(fileUri, JournalrConfig.fromConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorerContextCopyId",
      (fileUri: vscode.Uri) => {
        menuCopyId(fileUri, JournalrConfig.fromConfig());
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
