import * as moment from "moment";
import * as vscode from "vscode";
import { DatabaseWatcher, TopicDb, Article, Topic } from "../topicdb";
import { encodeUriMd } from "../utils";
import { JournalrConfig, ConfigWatcher } from "../config";

function articleToDisplayItem(a: Article): string {
  // Infer the topic it belongs to. Maybe worth tracking this directly in the article?
  const relPath = vscode.workspace.asRelativePath(a.uri);
  const topicName = relPath.split("/").slice(0, -1).join("/");
  // Need to add a trailing slash since the `split` took it away
  const topicTag = topicName ? "/" : "";

  return `/${topicName}${topicTag}${a.title}`;
}

function topicToDisplayItem(t: Topic): string {
  const relpath = vscode.workspace.asRelativePath(t.uri);
  return `/${relpath}`;
}

async function translatedPick<T>(
  allItems: Thenable<T[]>,
  xform: (t: T) => string
): Promise<T | undefined> {
  // Oh Lord this is inefficient, but I'm not sure how else to map the display names
  // to the URIs.
  const names: Map<string, T> = new Map();
  const displayItems = allItems.then((ts) => {
    return ts.map((t) => {
      const display = xform(t);
      names.set(display, t);
      return display;
    });
  });
  const itemPick = await vscode.window.showQuickPick(displayItems);

  if (itemPick === undefined) {
    return undefined;
  }

  return names.get(itemPick);
}

export async function copyNoteId(database: TopicDb) {
  const articlePick = await translatedPick(
    database.allArticles(vscode.workspace.fs),
    articleToDisplayItem
  );

  if (articlePick === undefined) {
    return;
  }

  const relpath = vscode.workspace.asRelativePath(articlePick.uri);
  await vscode.env.clipboard.writeText(`/${encodeUriMd(relpath)}`);
}

export async function copyNoteIdWithTitle(database: TopicDb) {
  const articlePick = await translatedPick(
    database.allArticles(vscode.workspace.fs),
    articleToDisplayItem
  );
  if (articlePick === undefined) {
    return;
  }

  const relpath = vscode.workspace.asRelativePath(articlePick.uri);
  await vscode.env.clipboard.writeText(
    `[${articlePick.title}](/${encodeUriMd(relpath)})`
  );
}

export async function createNote(
  database: TopicDb,
  config: JournalrConfig,
  now: moment.Moment
) {
  const topicPick = await translatedPick(
    database.allTopics(vscode.workspace.fs),
    topicToDisplayItem
  );
  if (topicPick === undefined) {
    return;
  }

  const formatted = now.format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(topicPick.uri, formatted);
  await vscode.workspace.fs.writeFile(noteUri, new Uint8Array());

  const doc = await vscode.workspace.openTextDocument(noteUri);
  await vscode.window.showTextDocument(doc);
}

export async function openNote(database: TopicDb) {
  const articlePick = await translatedPick(
    database.allArticles(vscode.workspace.fs),
    articleToDisplayItem
  );
  if (articlePick === undefined) {
    return;
  }

  const doc = await vscode.workspace.openTextDocument(articlePick.uri);
  await vscode.window.showTextDocument(doc);
}

export function register(
  context: vscode.ExtensionContext,
  dbWatcher: DatabaseWatcher,
  config: ConfigWatcher
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.copyId", () => {
      copyNoteId(dbWatcher.currentDb());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.copyIdWithTitle", () => {
      copyNoteIdWithTitle(dbWatcher.currentDb());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.createNote", () => {
      createNote(dbWatcher.currentDb(), config.currentConfig(), moment());
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.openNote", () =>
      openNote(dbWatcher.currentDb())
    )
  );
}
