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