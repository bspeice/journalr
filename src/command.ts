import * as vscode from "vscode";
import * as moment from "moment";
import { JournalrConfig } from './config';

function createNote(fileUri: vscode.Uri): Thenable<vscode.Uri> {
    return vscode.workspace.fs.writeFile(fileUri, new Uint8Array()).then(() => { return fileUri; });
}

function openNote(fileUri: vscode.Uri): Thenable<vscode.TextEditor> {
    return vscode.workspace.openTextDocument(fileUri)
    .then((doc) => { return vscode.window.showTextDocument(doc); });
}

export function createJournal(config: JournalrConfig) {
    if (!config.journalFormats) {
        vscode.window.showInformationMessage("No journal formats are currently configured.");
        return;
    }

    vscode.window.showQuickPick(config.journalFormats)
    .then((pick) => {
        if (!pick) {
            vscode.window.showInformationMessage("Nothing was picked.");
            return;
        }

        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders) {
            vscode.window.showInformationMessage("Unable to create journal entry when there is no workspace");
            return;
        }

        const rootUri = wsFolders[0].uri;
        const formatted = moment().format(pick);
        const journalUri = vscode.Uri.joinPath(rootUri, formatted);

        createNote(journalUri).then(openNote);
    });
}

export function explorerContextCreateNote(fileUri: vscode.Uri, config: JournalrConfig) {
    if (!config.contextMenuFormat) {
        vscode.window.showInformationMessage("No context menu format currently configured.");
        return;
    }

    const formatted = moment().format(config.contextMenuFormat);
    vscode.window.showInformationMessage(`Formatted: ${formatted}`);
    const noteUri = vscode.Uri.joinPath(fileUri, formatted);

    vscode.window.showInformationMessage(`URI: ${noteUri}`);
    createNote(noteUri).then(openNote);
}

export function insertAttachment(config: JournalrConfig) {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) {
        vscode.window.showInformationMessage("Unable to save attachments if there is no workspace");
        return;
    }

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        vscode.window.showInformationMessage("Unable to save attachments without an active editor");
        return;
    }

    vscode.window.showOpenDialog({ canSelectMany: false })
    .then((fileUris?: vscode.Uri[]) => {
        if (!fileUris) {
            throw new Error("No file selected");
        }
        const fileUri = fileUris[0];

        const extensionSplit = fileUri.fsPath.split('.');
        const extension = extensionSplit.length > 1 ? `.${extensionSplit[extensionSplit.length - 1]}` : ``;
        const attachmentName = moment().format(`${config.attachmentFormat}[${extension}]`);
        const attachmentUri = vscode.Uri.joinPath(wsFolders[0].uri, attachmentName);

        vscode.workspace.fs.copy(fileUri, attachmentUri).then(() => { 
            const snippet = new vscode.SnippetString(`[$1](/${attachmentName})`);
            activeEditor.insertSnippet(snippet);
        });
    });
}