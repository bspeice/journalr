import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";
import { createNote, openNote, noteTitle } from "./utils";

export async function menuCreateNote(
  fileUri: vscode.Uri,
  config: JournalrConfig
) {
  const formatted = moment().format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(fileUri, formatted);

  await createNote(noteUri).then(openNote);
}

export async function menuCopyId(
    fileUri: vscode.Uri,
    config: JournalrConfig,
) {
    const relpath = vscode.workspace.asRelativePath(fileUri);
    const title = await noteTitle(fileUri);

    vscode.env.clipboard.writeText(`[${title}](/${relpath})`);
}
