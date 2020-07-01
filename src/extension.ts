import * as vscode from "vscode";
import { JournalrConfig } from "./config";

import * as attachment from "./command/attachment";
import * as explorer from "./command/explorer";
import * as journal from "./command/journal";
import { TopicBrowserProvider } from "./view/topic";
import {
  TopicEntry,
  Article,
  DatabaseWatcher,
  WorkspaceWatcher,
} from "./topicdb";
import * as topicBrowser from "./command/topic_browser";
import moment = require("moment");
import { BacklinkProvider } from "./view/backlinks";

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
        explorer.copyId(fileUri);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.copyIdWithTitle",
      (fileUri: vscode.Uri) => {
        explorer.copyIdWithTitle(fileUri);
      }
    )
  );

  const dbWatcher = new WorkspaceWatcher(JournalrConfig.fromConfig());

  const topicProvider = new TopicBrowserProvider(dbWatcher);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.topicBrowser",
      topicProvider
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.topicBrowser.refresh", () => {
      // TODO: Is this actually useful?
      // The workspace watcher should be able to track all the relevant invalidations.
      topicProvider.refresh();
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
      "journalr.topicBrowser.copyIdWithTitle",
      (node: TopicEntry) => {
        topicBrowser.copyIdWithTitle(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createNote",
      (node: TopicEntry) => {
        topicBrowser.createNote(node, moment(), JournalrConfig.fromConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createRootTopic",
      () => {
        topicBrowser.createRootTopic();
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
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.showArticle",
      (article: Article) => topicBrowser.showArticle(article)
    )
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "journalr.backlinks",
      new BacklinkProvider(dbWatcher)
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
