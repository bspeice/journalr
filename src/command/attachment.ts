import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig, ConfigWatcher } from "../config";

async function importAttachments(
  config: JournalrConfig,
  now: moment.Moment,
  formatter: (name: string, index: number) => string
): Promise<void> {
  const wsFolders = vscode.workspace.workspaceFolders;
  if (!wsFolders) {
    return;
  }
  const attachmentRoot = wsFolders[0].uri;

  const uris = await vscode.window.showOpenDialog({ canSelectMany: true });
  if (!uris) {
    return;
  }

  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor === undefined) {
    return;
  }

  var attachmentNames = [];
  for (const [i, fileUri] of uris.entries()) {
    const extensionSplit = fileUri.fsPath.split(".");
    const extension =
      extensionSplit.length > 1
        ? `.${extensionSplit[extensionSplit.length - 1]}`
        : ``;

    const tag = uris.length !== 1 ? `_${i}` : "";
    const attachmentName = now.format(
      `${config.attachmentFormat}[${tag}${extension}]`
    );
    const attachmentUri = vscode.Uri.joinPath(attachmentRoot, attachmentName);

    await vscode.workspace.fs.copy(fileUri, attachmentUri);
    attachmentNames.push(attachmentName);
  }

  const snippetString = attachmentNames
    .map((name, index) => formatter(name, index))
    .join("\n\n");
  const snippet = new vscode.SnippetString(snippetString);
  await activeEditor.insertSnippet(snippet);

  return;
}

function formatAttachment(name: string, index: number) {
  return `[$${index + 1}](/${name})`;
}

function formatImage(name: string, index: number) {
  return `![$${index + 1}](/${name})`;
}

export function register(
  context: vscode.ExtensionContext,
  configWatcher: ConfigWatcher
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.attachment.insertAttachment",
      () => {
        importAttachments(
          configWatcher.currentConfig(),
          moment(),
          formatAttachment
        );
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.attachment.insertImage", () => {
      importAttachments(configWatcher.currentConfig(), moment(), formatImage);
    })
  );
}
