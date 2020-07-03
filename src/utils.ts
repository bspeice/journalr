import * as vscode from "vscode";

export async function createNote(fileUri: vscode.Uri): Promise<vscode.Uri> {
  await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
  return fileUri;
}

export async function openNote(
  fileUri: vscode.Uri
): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument(fileUri);
  return await vscode.window.showTextDocument(doc);
}

export function dirname(uri: vscode.Uri): vscode.Uri {
  return vscode.Uri.file(uri.path.split("/").slice(0, -1).join("/"));
}

export function encodeUriMd(uri: vscode.Uri | string): string {
  return uri.toString().replace(/ /g, "%20");
}

export const MD_EXTENSIONS = ["md"];
