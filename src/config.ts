import * as vscode from "vscode";

export interface JournalrConfig {
  attachmentFormat: string;
  contextMenuFormat: string;
  journalFormats: string[];
  ignoreGlobs: string[];
  tagPrefix: string;
}

function buildConfig(): JournalrConfig {
  const journalr = vscode.workspace.getConfiguration("journalr");
  return {
    attachmentFormat:
      journalr.get("attachmentFormat") ?? "_attachments/YYYYMMDDhhmmss",
    contextMenuFormat: journalr.get("contextMenuFormat") ?? "YYYYMMDD[.md]",
    journalFormats: journalr.get("journalFormats") ?? [],
    ignoreGlobs: journalr.get("ignoreGlobs") ?? ["**/.*"],
    tagPrefix: journalr.get("tagPrefix") ?? "#",
  };
}

export interface ConfigWatcher {
  onChange: vscode.Event<JournalrConfig>;
  currentConfig(): JournalrConfig;
}

const CONFIG_KEYS = [
  "journalr.attachmentFormat",
  "journalr.contextMenuFormat",
  "journalr.journalFormats",
  "journalr.ignoreGlobs",
  "journalr.tagPrefix",
];

export class WorkspaceConfig implements ConfigWatcher {
  private config: JournalrConfig;
  private emitter: vscode.EventEmitter<JournalrConfig>;

  public onChange: vscode.Event<JournalrConfig>;

  public constructor() {
    this.emitter = new vscode.EventEmitter();
    this.onChange = this.emitter.event;

    this.config = buildConfig();

    vscode.workspace.onDidChangeConfiguration(this.reloadConfig, this);
  }

  private reloadConfig(event: vscode.ConfigurationChangeEvent) {
    for (const conf of CONFIG_KEYS) {
      if (event.affectsConfiguration(conf)) {
        this.config = buildConfig();
        this.emitter.fire(this.config);
        return;
      }
    }
  }

  currentConfig(): JournalrConfig {
    return this.config;
  }
}
