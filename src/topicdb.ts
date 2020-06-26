import * as vscode from "vscode";
import * as utils from "./utils";
import { dir } from "console";

export enum EntryType {
  Topic = 1,
  Article,
}

export interface Topic {
  type: EntryType;
  title: string;
  uri: vscode.Uri;
  isRoot: boolean;
  entries: Thenable<TopicEntry[]>;
}

export interface Article {
  type: EntryType;
  title: string;
  uri: vscode.Uri;
}

export type TopicEntry = Topic | Article;

export interface TopicDb {
  topics: Thenable<TopicEntry[]>;
}

/*
async function __buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Promise<Topic> {
  console.log(`Building topic ${root}`);

  var entries: Thenable<TopicEntry>[] = [];
  const dirEntries = await vscode.workspace.fs.readDirectory(root);
  for (const [itemName, ft] of dirEntries) {
    const itemUri = vscode.Uri.joinPath(root, itemName);
    if (ft === vscode.FileType.Directory) {
      entries.push(buildTopic(itemName, itemUri, false));
    } else if (ft === vscode.FileType.File) {
      const title = await utils.noteTitle(itemUri);
      if (title === undefined) {
        continue;
      }

      const article = {
        type: EntryType.Article,
        title: title,
        uri: itemUri,
      };
      entries.push(Promise.resolve(article));
    }
  }

  return {
    type: EntryType.Topic,
    title: name,
    uri: root,
    isRoot: isRootTopic,
    entries: Promise.all(entries),
  };
}
*/

function buildArticle(
  name: string,
  rootUri: vscode.Uri
): Thenable<Article | undefined> {
  const itemUri = vscode.Uri.joinPath(rootUri, name);
  return utils.noteTitle(itemUri).then((title) => {
    if (title === undefined) {
      return undefined;
    }

    return {
      type: EntryType.Article,
      title: title,
      uri: itemUri,
    };
  });
}

function buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Topic {
  const entries = vscode.workspace.fs.readDirectory(root).then((dirEntries) => {
    console.log(`Finished reading ${root}`);
    return dirEntries;
  });
  const topics = entries
    .then((dirEntries) => {
      return dirEntries
        .filter(([_, ft]) => ft === vscode.FileType.Directory)
        .map(([name, _]) => name);
    })
    .then((dirEntries) =>
      dirEntries.map((name) =>
        buildTopic(name, vscode.Uri.joinPath(root, name), false)
      )
    )
    .then(
      (topicPromises) => Promise.all(topicPromises) as Thenable<TopicEntry[]>
    );

  const articles = entries
    .then((dirEntries) => {
      return dirEntries
        .filter(([_, ft]) => ft === vscode.FileType.File)
        .map(([name, _]) => name);
    })
    .then((dirEntries) => {
      return dirEntries.map((name) => buildArticle(name, root));
    })
    .then((articlePromises) => Promise.all(articlePromises))
    .then(
      (articles) => articles.filter((a) => a !== undefined) as TopicEntry[]
    );

  const topicEntries = Promise.all([
    topics,
    articles,
  ]).then(([topics, articles]) => topics.concat(articles));

  // NOTE: I think all the eager recursive is because of this Promise.resolve
  return {
    type: EntryType.Topic,
    title: name,
    uri: root,
    isRoot: isRootTopic,
    entries: topicEntries,
  };
}

/*
function buildTopic(
  name: string,
  root: vscode.Uri,
  isRootTopic: boolean
): Thenable<Topic> {
  console.log(`Building topic ${root}`);
  const result = vscode.workspace.fs.readDirectory(root).then((dirEntries) => {
    const topicPromises = dirEntries
      .filter(([_, ft]) => ft === vscode.FileType.Directory)
      .map(([name, _]) => name)
      .map((name) => buildTopic(name, vscode.Uri.joinPath(root, name), false) as Thenable<TopicEntry>);
    const topics = Promise.all(topicPromises);


    const articlePromises = dirEntries
      .filter(([_, ft]) => ft === vscode.FileType.File)
      .map(([name, _]) => name)
      .map((name) => buildArticle(name, root));
    const articles = Promise.all(articlePromises).then(
      (articles) => articles.filter((a) => a !== undefined) as TopicEntry[]
    );

    return Promise.all([topics, articles]).then(([topics, articles]) => topics.concat(articles));
  })
  .then((entries) => {
    return {
      type: EntryType.Topic,
      title: name,
      uri: root,
      isRoot: isRootTopic,
      entries: entries
    };
  });

  return Promise.resolve({
    type: EntryType.Topic,
    title: name,
    uri: root,
    isRoot: isRootTopic,
    entries: Promise.resolve([]),
  });
}
*/

export function workspaceDb(): TopicDb {
  const wsFolders = vscode.workspace.workspaceFolders ?? [];
  const rootTopics = wsFolders.map((f) => buildTopic(f.name, f.uri, true));
  const allEntries = Promise.all(rootTopics);

  return {
    topics: allEntries,
  };
}
