# TODO

## General
- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI.
- Workspace file watcher to trigger refresh (need to make sure commands that currently trigger a refresh *don't cause a double refresh*))
- Ctrl-P handler for opening notes by title. Will potentially be a performance issue because it requires scanning the entire DB.
  Properly handling exclusions is going to be crucial here.

## Topic Browser
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as "drag and drop",
  but it appears that VS Code [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592).
  This would be *incredibly* complicated to do correctly and is considered low priority.
- Exclude folders and files based on glob expressions - want to make sure that `.git` isn't scanned for example.
  Might be worth looking into an [external lib](https://github.com/isaacs/minimatch) for handling.