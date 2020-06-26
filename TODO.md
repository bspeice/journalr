# TODO

## General
- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI.
- Workspace file watcher to trigger refresh (need to make sure commands that currently trigger a refresh *don't cause a double refresh*))

## Topic Browser
- After creating a new note, open it in a new editor
- Add a command to copy note IDs without titles
- Add a command for creating a root topic
- URI encoding? Handling spaces is weird. `encodeURI` doesn't handle spaces at all, and `encodeURIComponent` improperly replaces `/`
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as "drag and drop",
  but it appears that VS Code [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592)