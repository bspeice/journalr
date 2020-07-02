import * as vscode from "vscode";
import { Article } from "../topicdb";

export async function showArticle(article: Article): Promise<void> {
  const doc = await vscode.workspace.openTextDocument(article.uri);
  await vscode.window.showTextDocument(doc);
}

export function register(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "journalr.articleLinks.showArticle",
      (article: Article) => showArticle(article)
    )
  );
}
