import * as vscode from 'vscode';

export class JournalrConfig {
    public contextMenuFormat: string;
    public journalFormats: string[];

    public constructor({ contextMenuFormat, journalFormats }: { contextMenuFormat: string, journalFormats: string[] }) {
        this.contextMenuFormat = contextMenuFormat;
        this.journalFormats = journalFormats;

    }

    public static fromConfig(): JournalrConfig {
        const journalr = vscode.workspace.getConfiguration("journalr");

        return new JournalrConfig({
            "contextMenuFormat": journalr.get("contextMenuFormat") ?? "YYYYMMDD.md",
            "journalFormats": journalr.get("journalFormats") ?? []
        });
    }
}