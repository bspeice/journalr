# TODO

## General
- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI.
  As inspiration, the [Foam](https://github.com/foambubble/foam-workspace-manager) workspace manager has no dependency on VS Code.
- Workspace file watcher to trigger refresh (need to make sure commands that currently trigger a refresh *don't cause a double refresh*))
- Ctrl-P handler for opening notes by title. Will potentially be a performance issue because it requires scanning the entire DB.
  Properly handling exclusions is going to be crucial here.
- Using the same "Ctrl-P" handler for copying note IDs would also be nice, rather than having to remember *exactly* where it was.
- Documentation - [Typedoc](http://typedoc.org/) will likely be the way to go.
- Search via metadata/front-matter? It may be easier to just use "Find Everywhere" instead.
- Alternative note formats?
  - [Margin](https://margin.love/#/)
- Attachments: import multiple, watch out for naming conflicts

## Topic Browser
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as "drag and drop",
  but it appears that VS Code [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592).
  This would be *incredibly* complicated to do correctly and is considered low priority.
- Display article backlinks. Note that this is essentially the same problem as moving a note.
  May be worth looking at [Foam](https://github.com/foambubble/foam) for how they handle performance? Or just using outright?
  - Turns out Foam simply scans *everything*: https://github.com/foambubble/foam-vscode/blob/965fca3bdd840ba08db6846e20ad605b5b51d9ea/src/workspace.ts#L9
- Exclude folders and files based on glob expressions - want to make sure that `.git` isn't scanned for example.
  Might be worth looking into an [external lib](https://github.com/isaacs/minimatch) for handling.
- Include files based on extension; don't attempt to load anything non-markdown. If files lie about the extension, oh well.