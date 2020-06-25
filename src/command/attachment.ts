import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";

async function importAttachment(
  config: JournalrConfig
): Promise<string | undefined> {
  const wsFolders = vscode.workspace.workspaceFolders;
  if (!wsFolders) {
    vscode.window.showWarningMessage(
      "Unable to save attachments if there is no workspace"
    );
    return;
  }

  const fileUris = await vscode.window.showOpenDialog({ canSelectMany: false });
  if (!fileUris) {
    throw new Error("No file selected");
  }
  const fileUri = fileUris[0];

  const extensionSplit = fileUri.fsPath.split(".");
  const extension =
    extensionSplit.length > 1
      ? `.${extensionSplit[extensionSplit.length - 1]}`
      : ``;
  const attachmentName = moment().format(
    `${config.attachmentFormat}[${extension}]`
  );
  const attachmentUri = vscode.Uri.joinPath(wsFolders[0].uri, attachmentName);

  await vscode.workspace.fs.copy(fileUri, attachmentUri);
  return attachmentName;
}

export async function insertAttachment(config: JournalrConfig) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showWarningMessage(
      "Unable to save attachments without an active editor"
    );
    return Promise.reject();
  }

  const attachmentName = await importAttachment(config);
  if (!attachmentName) {
    return;
  }

  const snippet = new vscode.SnippetString(`[$1](/${attachmentName})`);
  return activeEditor.insertSnippet(snippet);
}

export async function insertImage(config: JournalrConfig) {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    vscode.window.showWarningMessage(
      "Unable to save attachments without an active editor"
    );
    return Promise.reject();
  }

  const attachmentName = await importAttachment(config);
  if (!attachmentName) {
    return;
  }

  const snippet = new vscode.SnippetString(`![$1](/${attachmentName})`);
  return activeEditor.insertSnippet(snippet);
}
