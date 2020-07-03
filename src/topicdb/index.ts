import * as vscode from "vscode";
import * as utils from "../utils";
import { JournalrConfig } from "../config";
import { FileReader, DirReader } from "../types";
import { Article } from "./article";
import { Topic } from "./topic";

export { Article, Topic };

export enum EntryType {
  Topic = 1,
  Article,
}

export interface TopicEntry {
  type: EntryType;
}

function zippedLinks(fileReader: FileReader, article: Article): Thenable<[Article, vscode.Uri][]> {
  return article.getLinks(fileReader).then((links) =>
    links.map((l) => [article, l])
  );
}

export class TopicDb {
  constructor(public topics: Topic[]) {}

  allArticles(dirReader: DirReader): Thenable<Article[]> {
    const articlesPromises = this.topics.map((t) =>
      t.recurseArticles(dirReader)
    );
    const allArticles = Promise.all(articlesPromises);

    return allArticles.then((nested) =>
      nested.reduce((acc, a) => acc.concat(a), [])
    );
  }

  findEntry(dirReader: DirReader, uri: vscode.Uri): Thenable<TopicEntry | undefined> {
    // TODO: More efficient way to handle this besides resolving all promises?
    // We only care about the first match. That said, early returns from topics
    // that know they can't have the element maybe make this less problematic?
    return Promise.all(this.topics.map((t) => t.findEntry(dirReader, uri)))
    .then((matches) => {
      for (const match of matches) {
        if (match !== undefined) {
          return match;
        }
      }
      
      return undefined;
    })
  }

  allTopics(dirReader: DirReader): Thenable<Topic[]> {
    const topicPromises = this.topics.map((t) => {
      return t.recurseTopics(dirReader);
    });
    const allTopics = Promise.all(topicPromises);

    return allTopics
      .then((nested) => nested.reduce((acc, t) => acc.concat(t), []));
  }

  backLinks(
    needle: Article,
    dirReader: DirReader,
    fileReader: FileReader
  ): Thenable<Article[]> {
    const haystack = this.allArticles(dirReader)
      .then((articles) =>
        Promise.all(articles.map((a) => zippedLinks(fileReader, a)))
      )
      .then((vals) => vals.reduce((acc, v) => acc.concat(v)));

    return haystack.then((pairs) => {
      return pairs
        .filter(([, link]) => link.fsPath === needle.uri.fsPath)
        .map(([article]) => article);
    });
  }
}

export interface DatabaseWatcher {
  onRefresh: vscode.Event<TopicDb>;
  currentDb(): TopicDb;
}

export class WorkspaceWatcher implements DatabaseWatcher {
  private database: TopicDb;
  private watcher: vscode.FileSystemWatcher;
  private emitter: vscode.EventEmitter<TopicDb>;

  public onRefresh: vscode.Event<TopicDb>;

  constructor(config: JournalrConfig) {
    // TODO: Add/remove workspace folders
    // TODO: Config updates
    const wsFolders = vscode.workspace.workspaceFolders ?? [];
    const ignore = config.ignoreGlobs;
    const topics = wsFolders.map((f) => {
      return new Topic(f.name, f.uri, f.uri, ignore);
    });
    this.database = new TopicDb(topics);

    this.emitter = new vscode.EventEmitter();
    this.onRefresh = this.emitter.event;

    this.watcher = vscode.workspace.createFileSystemWatcher(
      `**/*.{${utils.MD_EXTENSIONS.join(",")}}`
    );
    this.watcher.onDidChange(this.onDidChange, this);
    this.watcher.onDidCreate(this.onDidCreate, this);
    this.watcher.onDidDelete(this.onDidDelete, this);
  }

  currentDb(): TopicDb {
    return this.database;
  }

  onDidChange(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }

  onDidCreate(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }

  onDidDelete(_uri: vscode.Uri) {
    for (const topic of this.database.topics) {
      // TODO: Finer-grained invalidation
      topic.invalidate();
    }
    this.emitter.fire(this.database);
  }
}
