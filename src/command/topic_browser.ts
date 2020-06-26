import * as vscode from "vscode";
import { TopicEntry, EntryType, Topic, Article, TopicDb } from "../topicdb";
import { JournalrConfig } from "../config";
import * as utils from "../utils";

// TODO: Command for creating a root topic?

export async function createTopic(node: TopicEntry): Promise<boolean> {
  if (node.type !== EntryType.Topic) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
    return false;
  }

  const topicName = await vscode.window.showInputBox({
    placeHolder: "Topic Name",
  });
  if (topicName === undefined) {
    return false;
  }

  const currentTopic = node as Topic;
  const newUri = vscode.Uri.joinPath(currentTopic.uri, topicName);

  await vscode.workspace.fs.createDirectory(newUri);
  return true;
}

export async function createNote(
  node: TopicEntry,
  moment: moment.Moment,
  config: JournalrConfig
): Promise<boolean> {
  if (node.type !== EntryType.Topic) {
    vscode.window.showErrorMessage(`Unexpected entry type=${node.type}`);
    return false;
  }

  const noteTitle = await vscode.window.showInputBox({
    placeHolder: "Note Name",
  });
  if (!noteTitle) {
    return false;
  }

  const topic = node as Topic;
  const formatted = moment.format(config.contextMenuFormat);
  const noteUri = vscode.Uri.joinPath(topic.uri, formatted);

  const doc = await utils.createNote(noteUri).then(utils.openNote);
  doc.edit((editor) => {
    editor.insert(new vscode.Position(0, 0), `# ${noteTitle}\n\n`);
  });
  return true;
}

export function copyId(_node: TopicEntry): void {}
