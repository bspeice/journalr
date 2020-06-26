import * as vscode from "vscode";
import { JournalrConfig } from "./config";

import * as attachment from "./command/attachment";
import * as explorer from "./command/explorer";
import * as journal from "./command/journal";
import { TopicBrowserProvider } from "./view/topic";
import { workspaceDb, TopicEntry } from "./topicdb";
import * as topicBrowser from "./command/topic_browser";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.journal.createJournal", () => {
      journal.createJournal(JournalrConfig.fromConfig());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.attachment.insertAttachment",
      attachment.insertAttachment
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.attachment.insertImage",
      attachment.insertImage
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.createNote",
      (fileUri: vscode.Uri) => {
        explorer.createNote(fileUri, JournalrConfig.fromConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.copyId",
      (fileUri: vscode.Uri) => {
        explorer.copyId(fileUri, JournalrConfig.fromConfig());
      }
    )
  );

  const topicProvider = new TopicBrowserProvider(workspaceDb());
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.topicBrowser",
      topicProvider
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.topicBrowser.refresh", () => {
      topicProvider.refresh(workspaceDb());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.copyId",
      (node: TopicEntry) => {
        topicBrowser.copyId(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createNote",
      (node: TopicEntry) => {
        topicBrowser.createNote(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createTopic",
      (node: TopicEntry) => {
        topicBrowser.createTopic(node);
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
