# TODO

- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating
  the UI. As inspiration, the [Foam](https://github.com/foambubble/foam-workspace-manager) workspace
  manager has no dependency on VS Code.
  - Could be interesting to make an "Actions" API - describe what should be done, and let someone
    else resolve the list of actions. Problem is that expressing error handling is way more
    difficult.
- Surgical TopicDB invalidation; right now it just triggers a full rescan. The ideal is that a full rescan is needed *only* on startup.
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
- Refresh topicBrowser on creating a new-subtopic; the URI doesn't match anything yet, but it does need to be re-scanned.
- Some sort of warning for things that *look* like internal links, but can't be resolved? Broken links detector?
- Maybe base everything on `uri.fsPath` instead of full URI?
- Allow filenames as note titles; don't want to exclude MD files based on not having a title.
