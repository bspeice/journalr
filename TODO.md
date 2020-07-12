# TODO

- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating
  the UI. As inspiration, the [Foam](https://github.com/foambubble/foam-workspace-manager) workspace
  manager has no dependency on VS Code.
  - Could be interesting to make an "Actions" API - describe what should be done, and let someone
    else resolve the list of actions. Problem is that expressing error handling is way more
    difficult.
- Surgical TopicDB invalidation; right now every action triggers a full rescan. The ideal is that a
  full rescan is needed _only_ on startup.
  - Cancellation tokens as well for DB scan operations.
  - Re-parsing the current file and updating backlinks should be part of this.
- Documentation - [Typedoc](http://typedoc.org/) will likely be the way to go.
- Add a menu entry for moving a note, but preserving all links. Would've rather handled this as
  "drag and drop", but it appears that VS Code
  [doesn't currently support this](https://github.com/Microsoft/vscode/issues/32592). This would be
  _incredibly_ complicated to do correctly and is considered low priority.
- Don't use manual note parsing to get titles; may be worth using an actual lexer and looking for
  the first `h1`?
- Relative-path link handling
- Some sort of warning for things that _look_ like internal links, but can't be resolved? Broken
  links detector?
- Maybe base everything on `uri.fsPath` instead of full URI for easier comparisons?
- Duplicate links detector? Would be cool to have some help "refactoring" links so that you can tie
  articles together.
- Display first N articles
  - Maybe with a "..." tree item that shows the next N articles?
  - Purpose is to have topics like "Journal" that will potentially contain hundreds of entries, but
    not all need to be displayed.
- Tag tracking; find text of the form `#my-tag` or `|my-tag` and link everything that uses that.
