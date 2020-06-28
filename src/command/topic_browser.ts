import * as vscode from "vscode";
import { TopicEntry, EntryType, Topic, Article, TopicDb } from "../topicdb";
import { JournalrConfig } from "../config";
import * as utils from "../utils";

export async function createTopic(node: TopicEntry): Promise<boolean> {
  if (node.type !== EntryType.Topic) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
    return false;
  }

  const topicName = await vscode.window.showInputBox({
    placeHolder: "Topic Name",
  });
  if (topicName === undefined) {
    return false;
  }

  const currentTopic = node as Topic;
  const newUri = vscode.Uri.joinPath(currentTopic.uri, topicName);

  await vscode.workspace.fs.createDirectory(newUri);
  return true;
}

export async function createRootTopic(): Promise<boolean> {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  if (wsFolders.length !== 1) {
    vscode.window.showWarningMessage(
      `Unexpected wsFolder length=${wsFolders.length}`
    );
    return false;
  }
  const wsRoot = wsFolders[0].uri;

  const topicName = await vscode.window.showInputBox({
    placeHolder: "Topic Name",
  });
  if (topicName === undefined) {
    return false;
  }

  const newUri = vscode.Uri.joinPath(wsRoot, topicName);
  await vscode.workspace.fs.createDirectory(newUri);
  return true;
}

export async function createNote(
  node: TopicEntry,
  moment: moment.Moment,
  config: JournalrConfig
): Promise<boolean> {
  if (node.type !== EntryType.Topic) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
    return false;
  }

  const noteTitle = await vscode.window.showInputBox({
    placeHolder: "Note Name",
  });
  if (!noteTitle) {
    return false;
  }

  const topic = node as Topic;
  const formatted = moment.format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(topic.uri, formatted);

  const doc = await utils.createNote(noteUri).then(utils.openNote);
  doc.edit((editor) => {
    editor.insert(new vscode.Position(0, 0), `# ${noteTitle}\n\n`);
  });
  return true;
}

export function copyId(node: TopicEntry): void {
  if (node.type !== EntryType.Article) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
  }

  const article = node as Article;
  const relPath = vscode.workspace.asRelativePath(article.uri);
  const mdEscape = utils.encodeUriMd(relPath);

  vscode.env.clipboard.writeText(`/${mdEscape}`);
}

export function copyIdWithTitle(node: TopicEntry): void {
  if (node.type !== EntryType.Article) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
  }

  const article = node as Article;
  const relPath = vscode.workspace.asRelativePath(article.uri);
  const mdEscape = utils.encodeUriMd(relPath);

  vscode.env.clipboard.writeText(`[${article.title}](/${mdEscape})`);
}

export async function showArticle(article: Article): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(article.uri);
  await vscode.window.showTextDocument(doc);
}
