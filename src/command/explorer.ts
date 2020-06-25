import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";
import { createNote, openNote } from "./utils";

export async function menuCreateNote(
  fileUri: vscode.Uri,
  config: JournalrConfig
) {
  if (!config.contextMenuFormat) {
    vscode.window.showWarningMessage(
      "No context menu format currently configured."
    );
    return;
  }

  const formatted = moment().format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(fileUri, formatted);

  createNote(noteUri).then(openNote);
}
