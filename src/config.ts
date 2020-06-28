import * as vscode from "vscode";

export class JournalrConfig {
  public attachmentFormat: string;
  public contextMenuFormat: string;
  public journalFormats: string[];
  public ignoreGlobs: string[];

  public constructor({
    attachmentFormat,
    contextMenuFormat,
    journalFormats,
    ignoreGlobs,
  }: {
    attachmentFormat: string;
    contextMenuFormat: string;
    journalFormats: string[];
    ignoreGlobs: string[];
  }) {
    this.attachmentFormat = attachmentFormat;
    this.contextMenuFormat = contextMenuFormat;
    this.journalFormats = journalFormats;
    this.ignoreGlobs = ignoreGlobs;
  }

  public static fromConfig(): JournalrConfig {
    const journalr = vscode.workspace.getConfiguration("journalr");

    const ignore: string[] = journalr.get("ignoreGlobs") ?? ["**/.*"];

    return new JournalrConfig({
      attachmentFormat:
        journalr.get("attachmentFormat") ?? "_attachments/YYYYMMDDhhmmss",
      contextMenuFormat: journalr.get("contextMenuFormat") ?? "YYYYMMDD.md",
      journalFormats: journalr.get("journalFormats") ?? [],
      ignoreGlobs: ignore,
    });
  }
}
