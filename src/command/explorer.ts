import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig, ConfigWatcher } from "../config";
import * as utils from "../utils";

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
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const mdEscape = utils.encodeUriMd(relpath);

  const title = await utils.noteTitle(fileUri);
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
