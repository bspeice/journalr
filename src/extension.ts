import * as vscode from "vscode";
import { JournalrConfig, WorkspaceConfig } from "./config";

import * as attachment from "./command/attachment";
import * as explorer from "./command/explorer";
import * as journal from "./command/journal";
import * as palette from "./command/palette";
import * as topicBrowser from "./command/topic_browser";
import * as backlinks from "./view/backlinks";
import * as topicView from "./view/topic";
import { WorkspaceWatcher } from "./topicdb";

export function activate(context: vscode.ExtensionContext) {
  const configWatcher = new WorkspaceConfig();
  const dbWatcher = new WorkspaceWatcher(configWatcher.currentConfig());

  topicView.register(context, dbWatcher);
  backlinks.register(context, dbWatcher);

  attachment.register(context, configWatcher);
  explorer.register(context, configWatcher);
  journal.register(context, configWatcher);
  palette.register(context, dbWatcher, configWatcher);
  topicBrowser.register(context, configWatcher);
}

// this method is called when your extension is deactivated
export function deactivate() {}
