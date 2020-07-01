import * as vscode from "vscode";

export type FileReader = (uri: vscode.Uri) => Thenable<Uint8Array>;

export const VSC_FILEREADER: FileReader = vscode.workspace.fs.readFile;

export type DirReader = (
  uri: vscode.Uri
) => Thenable<[string, vscode.FileType][]>;

export const VSC_DIRREADER: DirReader = vscode.workspace.fs.readDirectory;
