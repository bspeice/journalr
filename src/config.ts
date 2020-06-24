import * as vscode from "vscode";

export class JournalrConfig {
  public attachmentFormat: string;
  public contextMenuFormat: string;
  public journalFormats: string[];

  public constructor({
    attachmentFormat,
    contextMenuFormat,
    journalFormats,
  }: {
    attachmentFormat: string;
    contextMenuFormat: string;
    journalFormats: string[];
  }) {
    this.attachmentFormat = attachmentFormat;
    this.contextMenuFormat = contextMenuFormat;
    this.journalFormats = journalFormats;
  }

  public static fromConfig(): JournalrConfig {
    const journalr = vscode.workspace.getConfiguration("journalr");

    return new JournalrConfig({
      attachmentFormat:
        journalr.get("attachmentFormat") ?? "_attachments/YYYYMMDDhhmmss",
      contextMenuFormat: journalr.get("contextMenuFormat") ?? "YYYYMMDD.md",
      journalFormats: journalr.get("journalFormats") ?? [],
    });
  }
}
