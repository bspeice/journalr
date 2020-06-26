import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";
import * as utils from "../utils";

export async function createNote(fileUri: vscode.Uri, config: JournalrConfig) {
  const formatted = moment().format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(fileUri, formatted);

  await utils.createNote(noteUri).then(utils.openNote);
}

export async function copyId(fileUri: vscode.Uri, _config: JournalrConfig) {
  const relpath = vscode.workspace.asRelativePath(fileUri);
  const title = await utils.noteTitle(fileUri);

  vscode.env.clipboard.writeText(`[${title}](/${relpath})`);
}
