import * as minimatch from 'minimatch';
import * as vscode from 'vscode';
import { TopicEntry, EntryType } from ".";
import { Article } from './article';

function matches(pattern: vscode.Uri, globs: string[]): boolean {
  const path = vscode.workspace.asRelativePath(pattern);
  return globs.some((g) => minimatch(path, g));
}

function joinUri(
  name: string,
  root: vscode.Uri,
  ft: vscode.FileType
): [string, vscode.Uri, vscode.FileType] {
  return [name, vscode.Uri.joinPath(root, name), ft];
}


export class Topic implements TopicEntry {
  public type: EntryType;
  private entries: Thenable<TopicEntry[]> | undefined;

  constructor(
    public title: string,
    public uri: vscode.Uri,
    public rootUri: vscode.Uri,
    public ignoreGlobs: string[]
  ) {
    this.type = EntryType.Topic;
  }

  isRoot(): boolean {
    return this.uri.fsPath === this.rootUri.fsPath;
  }

  invalidate() {
    this.entries = undefined;
  }

  getEntries(fs: vscode.FileSystem): Thenable<TopicEntry[]> {
    if (this.entries !== undefined) {
      return this.entries;
    }

    // TODO: I'm seeing some weird issues when not using the `readDirectory` function by name
    const entries = fs.readDirectory(this.uri)
      .then((d) => d.map(([name, ft]) => joinUri(name, this.uri, ft)))
      .then((d) => d.filter(([, uri]) => !matches(uri, this.ignoreGlobs)))
      .then((dirEntries) => {
        const articles = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.File)
          .map(([, uri]) => Article.fromUri(fs, uri, this.rootUri))
          .reverse();

        const topics = dirEntries
          .filter(([, , ft]) => ft === vscode.FileType.Directory)
          .map(([name, uri]) => {
            return new Topic(name, uri, this.rootUri, this.ignoreGlobs);
          })
          .map((t) => Promise.resolve(t)) as Thenable<TopicEntry | undefined>[];

        return Promise.all(topics.concat(articles)).then((entries) =>
          entries.filter((e) => e !== undefined)
        );
      }) as Thenable<TopicEntry[]>;

    this.entries = entries;
    return entries;
  }

  findEntry(fs: vscode.FileSystem, uri: vscode.Uri): Thenable<TopicEntry | undefined> {
    // First, check if it's possible for us to contain this entry
    const thisPathComponents = this.uri.fsPath.split('/');
    const thatPathComponents = uri.fsPath.split('/').slice(0, thisPathComponents.length);

    // WHY THE HELL CAN'T I COMPARE ARRAYS IN JAVASCRIPT???
    if (thisPathComponents.length !== thatPathComponents.length) {
      return Promise.resolve(undefined);
    }
    const isEqual = thisPathComponents.map((v, i) => v === thatPathComponents[i])
      .reduce((acc, v) => acc && v, true);
    if (!isEqual) {
      return Promise.resolve(undefined);
    }

    // For all our entries, if there's a match, return immediately. Otherwise, allow topics
    // to recurse.
    return this.getEntries(fs)
    .then((entries) => {
      const toScan = [];
      for (const entry of entries) {
        if (entry.type === EntryType.Article) {
          const e = entry as Article;
          if (e.uri.fsPath === uri.fsPath) {
            return e;
          }
        } else if (entry.type === EntryType.Topic) {
          const e = entry as Topic;
          if (e.uri.fsPath === uri.fsPath) {
            return e;
          }

          toScan.push(e.findEntry(fs, uri))
        }
      }

      // We now know everything left to scan; kick off the recursion, and the filter results
      return Promise.all(toScan).then((matches) => {
        for (const match of matches) {
          if (match !== undefined) {
            return match;
          }
        }

        return undefined;
      })
    });
  }

  recurseArticles(fs: vscode.FileSystem): Thenable<Article[]> {
    const entries = this.getEntries(fs);

    const articles = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Article)
    ) as Thenable<Article[]>;
    const topics = entries.then((entries) =>
      entries.filter((e) => e.type === EntryType.Topic)
    ) as Thenable<Topic[]>;

    const topicArticles = topics
      .then((topics) => {
        return Promise.all(topics.map((t) => t.recurseArticles(fs)));
      })
      .then((articles) =>
        articles.reduce((acc, a) => acc.concat(a), [])
      ) as Thenable<Article[]>;

    return Promise.all([
      topicArticles,
      articles,
    ]).then(([topicArticles, articles]) => topicArticles.concat(articles));
  }

  recurseTopics(fs: vscode.FileSystem): Thenable<Topic[]> {
    return this.getEntries(fs)
      .then((e) => e.filter((e) => e.type === EntryType.Topic) as Topic[])
      .then((topics) => {
        const allTopics = [];
        for (const topic of topics) {
          allTopics.push(Promise.resolve([topic]));
          allTopics.push(topic.recurseTopics(fs));
        }
        return Promise.all(allTopics);
      })
      .then((topics) => topics.reduce((acc, t) => acc.concat(t), []));
  }
}