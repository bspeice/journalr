import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";
import * as utils from "../utils";

export async function createNote(fileUri: vscode.Uri, config: JournalrConfig) {
  const formatted = moment().format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(fileUri, formatted);

  await utils.createNote(noteUri).then(utils.openNote);
}

export async function copyId(fileUri: vscode.Uri) {
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const mdEscape = utils.encodeUriMd(relpath);

  vscode.env.clipboard.writeText(mdEscape);
}

export async function copyIdWithTitle(fileUri: vscode.Uri) {
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const mdEscape = utils.encodeUriMd(relpath);

  const title = await utils.noteTitle(fileUri);
  vscode.env.clipboard.writeText(`[${title}](/${mdEscape})`);
}
