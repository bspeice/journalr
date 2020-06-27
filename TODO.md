# TODO

## General
- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI.
- Workspace file watcher to trigger refresh (need to make sure commands that currently trigger a refresh *don't cause a double refresh*))

## Topic Browser
- Add a command for creating a root topic
- URI encoding? Handling spaces is weird. `encodeURI` doesn't handle spaces at all, and `encodeURIComponent` improperly replaces `/`
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as "drag and drop",
  but it appears that VS Code [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592)
- Exclude folders and files based on glob expressions - want to make sure that `.git` isn't scanned for example.