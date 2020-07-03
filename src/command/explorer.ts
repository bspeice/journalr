import * as vscode from "vscode";
import * as moment from "moment";
import * as utils from "../utils";
import { readMdTitle } from "../topicdb/article";
import { JournalrConfig, ConfigWatcher } from "../config";

export async function createNote(fileUri: vscode.Uri, config: JournalrConfig) {
  const formatted = moment().format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(fileUri, formatted);

  await utils.createNote(noteUri).then(utils.openNote);
}

export async function copyId(fileUri: vscode.Uri) {
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const mdEscape = utils.encodeUriMd(relpath);

  vscode.env.clipboard.writeText(`/${mdEscape}`);
}

export async function copyIdWithTitle(fileUri: vscode.Uri) {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  if (wsFolders.length == 0) {
    await vscode.window.showInformationMessage("Unable to find workspace folders");
    return;
  }

  const wsRoot = wsFolders[0];
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const mdEscape = utils.encodeUriMd(relpath);

  const title = await readMdTitle(vscode.workspace.fs, fileUri, wsRoot.uri);
  vscode.env.clipboard.writeText(`[${title}](/${mdEscape})`);
}

export function register(
  context: vscode.ExtensionContext,
  config: ConfigWatcher
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.createNote",
      (fileUri: vscode.Uri) => {
        createNote(fileUri, config.currentConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.copyId",
      (fileUri: vscode.Uri) => {
        copyId(fileUri);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.explorer.copyIdWithTitle",
      (fileUri: vscode.Uri) => {
        copyIdWithTitle(fileUri);
      }
    )
  );
}
