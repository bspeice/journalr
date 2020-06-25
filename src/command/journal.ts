import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";
import { createNote, openNote } from "./utils";

export async function createJournal(config: JournalrConfig) {
  if (!config.journalFormats) {
    vscode.window.showWarningMessage(
      "No journal formats are currently configured."
    );
    return;
  }

  const wsFolders = vscode.workspace.workspaceFolders;
  if (!wsFolders) {
    vscode.window.showWarningMessage(
      "Unable to create journal entry when there is no workspace"
    );
    return;
  }

  const picked = await vscode.window.showQuickPick(config.journalFormats);
  if (!picked) {
    vscode.window.showWarningMessage("Nothing was picked.");
    return;
  }

  const rootUri = wsFolders[0].uri;
  const formatted = moment().format(picked);
  const journalUri = vscode.Uri.joinPath(rootUri, formatted);

  createNote(journalUri).then(openNote);
}
