import * as vscode from "vscode";
import * as utils from "../utils";
import { JournalrConfig } from "../config";
import { Article } from "./article";
import { Topic } from "./topic";
import { access } from "fs";

export { Article, Topic };

export enum EntryType {
  Topic = 1,
  Article,
}

export interface TopicEntry {
  type: EntryType;
}

function zippedLinks(
  fs: vscode.FileSystem,
  article: Article
): Thenable<[Article, vscode.Uri][]> {
  return article.getLinks(fs).then((links) => links.map((l) => [article, l]));
}

function zippedTags(
  fs: vscode.FileSystem,
  article: Article,
  tagPrefix: string
): Thenable<[Article, string][]> {
  return article
    .getTags(fs, tagPrefix)
    .then((tags) => tags.map((t) => [article, t]));
}

export class TopicDb {
  constructor(public topics: Topic[]) {}

  findEntry(
    fs: vscode.FileSystem,
    uri: vscode.Uri
  ): Thenable<TopicEntry | undefined> {
    // TODO: More efficient way to handle this besides resolving all promises?
    // We only care about the first match. That said, early returns from topics
    // that know they can't have the element may make this less problematic?
    return Promise.all(this.topics.map((t) => t.findEntry(fs, uri))).then(
      (matches) => {
        for (const match of matches) {
          if (match !== undefined) {
            return match;
          }
        }

        return undefined;
      }
    );
  }

  allArticles(fs: vscode.FileSystem): Thenable<Article[]> {
    const articlesPromises = this.topics.map((t) => t.recurseArticles(fs));
    const allArticles = Promise.all(articlesPromises);

    return allArticles.then((nested) =>
      nested.reduce((acc, a) => acc.concat(a), [])
    );
  }

  allTags(fs: vscode.FileSystem, tagPrefix: string): Thenable<string[]> {
    return this.allArticles(fs)
      .then((articles) =>
        Promise.all(articles.map((a) => a.getTags(fs, tagPrefix)))
      )
      .then((vals) => vals.reduce((acc, v) => acc.concat(v)))
      .then((vals) => Array.from(new Set(vals)));
  }

  allTopics(fs: vscode.FileSystem): Thenable<Topic[]> {
    const topicPromises = this.topics.map((t) => {
      return t.recurseTopics(fs);
    });
    const allTopics = Promise.all(topicPromises);

    return allTopics.then((nested) =>
      nested.reduce((acc, t) => acc.concat(t), [])
    );
  }

  backLinks(fs: vscode.FileSystem, needle: Article): Thenable<Article[]> {
    const haystack = this.allArticles(fs)
      .then((articles) => Promise.all(articles.map((a) => zippedLinks(fs, a))))
      .then((vals) => vals.reduce((acc, v) => acc.concat(v)));

    return haystack.then((pairs) => {
      return pairs
        .filter(([, link]) => link.fsPath === needle.uri.fsPath)
        .map(([article]) => article);
    });
  }

  tagged(
    fs: vscode.FileSystem,
    tag: string,
    tagPrefix: string
  ): Thenable<Article[]> {
    const haystack = this.allArticles(fs)
      .then((articles) =>
        Promise.all(articles.map((a) => zippedTags(fs, a, tagPrefix)))
      )
      .then((vals) => vals.reduce((acc, v) => acc.concat(v)));

    return haystack.then((pairs) => {
      return pairs.filter(([, t]) => t === tag).map(([article]) => article);
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
      return new Topic(f.name, f.uri, f.uri, ignore, undefined);
    });
    this.database = new TopicDb(topics);

    this.emitter = new vscode.EventEmitter();
    this.onRefresh = this.emitter.event;

    // Note: We watch *everything* because we're interested in topics being created, not just articles.
    // this.watcher = vscode.workspace.createFileSystemWatcher(
    //   `**/*.{${utils.MD_EXTENSIONS.join(",")}}`
    // );
    this.watcher = vscode.workspace.createFileSystemWatcher("**/*");
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
