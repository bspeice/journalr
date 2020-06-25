import * as vscode from "vscode";

export interface Topic {
  title: string;
  uri: vscode.Uri;
  subtopics: Topic[];
  articles: Article[];
}

export interface Article {
  title: string;
  uri: vscode.Uri;
}

export interface TopicDb {
  topics: Topic[];
}

async function fromRoots(roots: vscode.Uri[]): Promise<TopicDb> {
  return { topics: [] };
}

var _currentDb: Promise<TopicDb> | undefined = undefined;

export function currentDb(): Promise<TopicDb> {
  // I have no idea if this is actually CAS; I'd rather not have two DBs getting simultaneously
  // constructed, but I can't find much information on implementing an actual lock.
  if (!_currentDb) {
    const wsFolders =
      vscode.workspace.workspaceFolders?.map((f) => f.uri) ?? [];
    _currentDb = fromRoots(wsFolders);
  }
  return _currentDb;
}

export function invalidateDb() {
  _currentDb = undefined;
}
