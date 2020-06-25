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

export async function noteTitle(fileUri: vscode.Uri): Promise<string> {
  const doc = await vscode.workspace.openTextDocument(fileUri);

  // If the document contains a `# ` as the first line, treat that as the title.
  // Otherwise, just use the `basename`
  const start = new vscode.Position(0, 0);
  const end = start.with({ line: 0, character: 2 });
  const range = new vscode.Range(start, end);

  if (doc.getText(range) === "# ") {
    return doc.lineAt(0).text.slice(2);
  } else {
    const components = fileUri.path.split("/");
    return components ? components[components.length - 1] : "";
  }
}
