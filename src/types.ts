import * as vscode from "vscode";

export type FileReader = (uri: vscode.Uri) => Thenable<Uint8Array>;

export const VSC_FILEREADER: FileReader = (uri: vscode.Uri) => { return vscode.workspace.fs.readFile(uri) };

export type DirReader = (
  uri: vscode.Uri
) => Thenable<[string, vscode.FileType][]>;

export const VSC_DIRREADER: DirReader = (uri: vscode.Uri) => { return vscode.workspace.fs.readDirectory(uri) };

export type Stat = (uri: vscode.Uri) => Thenable<vscode.FileStat>;

export const VSC_STAT: Stat = (uri: vscode.Uri) => { return vscode.workspace.fs.stat(uri) };
