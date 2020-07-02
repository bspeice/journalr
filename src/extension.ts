import * as vscode from "vscode";
import { JournalrConfig, WorkspaceConfig } from "./config";

import * as attachment from "./command/attachment";
import * as explorer from "./command/explorer";
import * as journal from "./command/journal";
import * as topicBrowser from "./command/topic_browser";
import * as backlinks from "./view/backlinks";
import * as topicView from "./view/topic";
import moment = require("moment");
import { BacklinkProvider } from "./view/backlinks";
import { WorkspaceWatcher } from "./topicdb";

export function activate(context: vscode.ExtensionContext) {
  const configWatcher = new WorkspaceConfig();
  const dbWatcher = new WorkspaceWatcher(configWatcher.currentConfig());

  const topicProvider = topicView.register(context, dbWatcher);
  backlinks.register(context, dbWatcher);

  attachment.register(context, configWatcher);
  explorer.register(context, configWatcher);
  journal.register(context, configWatcher);
  topicBrowser.register(context, configWatcher, topicProvider);
}

// this method is called when your extension is deactivated
export function deactivate() {}
