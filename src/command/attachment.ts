import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from "../config";

async function _importAttachments(
  config: JournalrConfig,
  now: moment.Moment,
  attachmentRoot: vscode.Uri,
  attachmentUris: vscode.Uri[]
): Promise<string[]> {
  var attachmentNames = [];
  for (const [i, fileUri] of attachmentUris.entries()) {
    const extensionSplit = fileUri.fsPath.split(".");
    const extension =
      extensionSplit.length > 1
        ? `.${extensionSplit[extensionSplit.length - 1]}`
        : ``;

    const tag = attachmentUris.length !== 1 ? `_${i}` : "";
    const attachmentName = now.format(
      `${config.attachmentFormat}[${tag}${extension}]`
    );
    const attachmentUri = vscode.Uri.joinPath(attachmentRoot, attachmentName);

    await vscode.workspace.fs.copy(fileUri, attachmentUri);
    attachmentNames.push(attachmentName);
  }

  return attachmentNames;
}

async function importAttachments(
  config?: JournalrConfig,
  now?: moment.Moment,
  attachmentRoot?: vscode.Uri,
  attachmentUris?: vscode.Uri[]
): Promise<string[]> {
  if (!attachmentRoot) {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) {
      return [];
    }

    attachmentRoot = wsFolders[0].uri;
  }

  if (!attachmentUris) {
    const uris = await vscode.window.showOpenDialog({ canSelectMany: true });
    if (!uris) {
      return [];
    }

    attachmentUris = uris;
  }

  config = config ?? JournalrConfig.fromConfig();
  now = now ?? moment();

  return await _importAttachments(config, now, attachmentRoot, attachmentUris);
}

async function importFormattedAttachment(
  nameFunc: (name: string, index: number) => string
) {
  const attachmentNames = await importAttachments();
  if (!attachmentNames) {
    return;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const snippetText = attachmentNames.map(nameFunc).join(", ");
  const snippet = new vscode.SnippetString(snippetText);
  return activeEditor.insertSnippet(snippet);
}

export async function insertAttachment() {
  return await importFormattedAttachment((n, i) => `[$${i + 1}](/${n})`);
}

export async function insertImage() {
  return await importFormattedAttachment((n, i) => `![$${i + 1}](/${n})`);
}
