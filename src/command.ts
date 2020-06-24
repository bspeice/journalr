import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "./config";

async function createNote(fileUri: vscode.Uri): Promise<vscode.Uri> {
  await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
  return fileUri;
}

async function openNote(fileUri: vscode.Uri): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument(fileUri);
  return await vscode.window.showTextDocument(doc);
}

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

export async function explorerContextCreateNote(
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
