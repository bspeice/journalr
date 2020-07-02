import * as vscode from "vscode";
import { DatabaseWatcher, Article } from "../topicdb";
import { VSC_DIRREADER } from "../types";
import { encodeUriMd } from "../utils";

function articleToDisplayItem(a: Article): string {
  // Infer the topic it belongs to. Maybe worth tracking this directly in the article?
  const relPath = vscode.workspace.asRelativePath(a.uri);
  const topicName = relPath.split("/").slice(0, -1).join("/");
  // Need to add a trailing slash since the `split` took it away
  const topicTag = topicName ? "/" : "";

  return `/${topicName}${topicTag}${a.title}`;
}

async function articlePick(
  dbWatcher: DatabaseWatcher,
  action: (a: Article) => void
) {
  // Oh Lord this is inefficient, but I'm not sure how else to map the display names
  // to the URIs.
  var articleNames: Map<string, Article> = new Map();
  const items = dbWatcher
    .currentDb()
    .allArticles(VSC_DIRREADER)
    .then((articles) => {
      return articles.map((a) => {
        const display = articleToDisplayItem(a);
        articleNames.set(display, a);
        return display;
      });
    });
  const itemPick = await vscode.window.showQuickPick(items);

  if (itemPick === undefined) {
    return;
  }

  const article = articleNames.get(itemPick);
  if (article === undefined) {
    // I don't think this is practically reachable?
    return;
  }

  await action(article);
}

export async function copyNoteId(dbWatcher: DatabaseWatcher) {
  await articlePick(dbWatcher, (a) => {
    const relpath = vscode.workspace.asRelativePath(a.uri);
    vscode.env.clipboard.writeText(`/${encodeUriMd(relpath)}`);
  });
}

export async function copyNoteIdWithTitle(dbWatcher: DatabaseWatcher) {
  await articlePick(dbWatcher, (a) => {
    const relpath = vscode.workspace.asRelativePath(a.uri);
    vscode.env.clipboard.writeText(`[${a.title}](/${encodeUriMd(relpath)})`);
  });
}

export async function openNote(dbWatcher: DatabaseWatcher) {
  await articlePick(dbWatcher, (a) => {
    vscode.workspace
      .openTextDocument(a.uri)
      .then((doc) => vscode.window.showTextDocument(doc));
  });
}

export function register(
  context: vscode.ExtensionContext,
  dbWatcher: DatabaseWatcher
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.copyId", () => {
      copyNoteId(dbWatcher);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.copyIdWithTitle", () => {
      copyNoteIdWithTitle(dbWatcher);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("journalr.palette.openNote", () =>
      openNote(dbWatcher)
    )
  );
}
