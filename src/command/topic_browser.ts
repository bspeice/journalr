import * as vscode from "vscode";
import { TopicEntry, EntryType, Topic, Article, TopicDb } from "../topicdb";
import { JournalrConfig, ConfigWatcher } from "../config";
import * as utils from "../utils";
import { TopicBrowserProvider } from "../view/topic";
import moment = require("moment");

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

  const topic = node as Topic;
  const formatted = moment.format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(topic.uri, formatted);

  const titleSnippet = new vscode.SnippetString(`# `);
  const doc = await utils.createNote(noteUri).then(utils.openNote);
  return await doc.insertSnippet(titleSnippet);
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

export function deleteNote(node: TopicEntry): void {
  if (node.type !== EntryType.Article) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
  }

  const article = node as Article;
  vscode.workspace.fs.delete(article.uri, {recursive: false});
}

export async function showArticle(article: Article): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(article.uri);
  await vscode.window.showTextDocument(doc);
}

export function register(
  context: vscode.ExtensionContext,
  configWatcher: ConfigWatcher,
  topicBrowser: TopicBrowserProvider
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.topicBrowser.refresh", () => {
      // TODO: Is this actually useful?
      // The workspace watcher should be able to track all the relevant invalidations.
      topicBrowser.refresh();
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.copyId",
      (node: TopicEntry) => {
        copyId(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.copyIdWithTitle",
      (node: TopicEntry) => {
        copyIdWithTitle(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createNote",
      (node: TopicEntry) => {
        createNote(node, moment(), configWatcher.currentConfig());
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.deleteNote",
      (node: TopicEntry) => {
        deleteNote(node)
      }
    )
  )
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createRootTopic",
      () => {
        createRootTopic();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.createTopic",
      (node: TopicEntry) => {
        createTopic(node);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.topicBrowser.showArticle",
      (article: Article) => showArticle(article)
    )
  );
}
