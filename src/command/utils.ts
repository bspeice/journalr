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
