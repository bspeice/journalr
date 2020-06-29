# TODO

- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI.
  As inspiration, the [Foam](https://github.com/foambubble/foam-workspace-manager) workspace manager has no dependency on VS Code.
  - Could be interesting to make an "Actions" API - describe what should be done, and let someone else resolve the list of actions.
    Problem is that expressing error handling is way more difficult.
- Workspace file watcher to trigger refresh rather than commands triggering static callbacks.
- Quick pick options for "Copy Note ID", "Create Note", and "Open Note"; would be nice quickly access notes when you already remember the title or can remember parts of it.
- Documentation - [Typedoc](http://typedoc.org/) will likely be the way to go.
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as "drag and drop",
  but it appears that VS Code [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592).
  This would be *incredibly* complicated to do correctly and is considered low priority.
- Display article backlinks. Note that this is essentially the same problem as moving a note.
  May be worth looking at [Foam](https://github.com/foambubble/foam) for how they handle performance? Or just using outright?
  - Turns out Foam simply scans *everything*: https://github.com/foambubble/foam-vscode/blob/965fca3bdd840ba08db6846e20ad605b5b51d9ea/src/workspace.ts#L9
- Include files based on extension; don't attempt to load anything non-markdown. If files lie about the extension, oh well.
- Remember opened topics on restart
  - Not sure what the best way to remember state is; readonly config variable?
- Copy Note ID with/out title in explorer menu
gg