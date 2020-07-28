import * as vscode from "vscode";
import { WorkspaceConfig } from "./config";

import * as articleLinks from "./view/articleLinks";
import * as articleTags from "./view/articleTags";
import * as attachment from "./command/attachment";
import * as explorer from "./command/explorer";
import * as general from "./command/general";
import * as journal from "./command/journal";
import * as palette from "./command/palette";
import * as topicBrowser from "./command/topic_browser";
import * as topicView from "./view/topic";
import { WorkspaceWatcher } from "./topicdb";

export function activate(context: vscode.ExtensionContext) {
  const configWatcher = new WorkspaceConfig();
  const dbWatcher = new WorkspaceWatcher(configWatcher.currentConfig());

  articleLinks.register(context, dbWatcher);
  articleTags.register(context, dbWatcher, configWatcher);
  topicView.register(context, dbWatcher);

  attachment.register(context, configWatcher);
  explorer.register(context, configWatcher);
  general.register(context);
  journal.register(context, configWatcher);
  palette.register(context, dbWatcher, configWatcher);
  topicBrowser.register(context, configWatcher);
}

// this method is called when your extension is deactivated
export function deactivate() {}
