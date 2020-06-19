import * as vscode from 'vscode';
import { JournalrConfig } from './config';
import * as command from './command';


export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(
		vscode.commands.registerCommand('journalr.createJournal', () => {
			command.createJournal(JournalrConfig.fromConfig());
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('journalr.explorerContextCreateNote', (fileUri: vscode.Uri) => {
			command.explorerContextCreateNote(fileUri, JournalrConfig.fromConfig());
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }
