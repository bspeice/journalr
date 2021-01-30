# TODO

- Separate commands from user input; need to add tests, and testing shouldn't rely on manipulating the UI. As inspiration, the [Foam](https://github.com/foambubble/foam-workspace-manager) workspace manager has no dependency on VS Code.
  - Could be interesting to make an "Actions" API - describe what should be done, and let someone else resolve the list of actions. Problem is that expressing error handling is way more difficult.
- Surgical TopicDB invalidation; right now every action triggers a full rescan. The ideal is that a full rescan is needed _only_ on startup.
  - Cancellation tokens as well for DB scan operations.
  - Re-parsing the current file and updating backlinks should be part of this.
- Documentation - [Typedoc](http://typedoc.org/) will likely be the way to go.
- Don't use manual note parsing to get titles; may be worth using an actual lexer and looking for the first `h1`?
- Relative-path link handling
- Some sort of warning for things that _look_ like internal links, but can't be resolved?
- Broken links detector? Especially helpful for attachments.
- Maybe base everything on `uri.fsPath` instead of full URI for easier comparisons?
- Copy note ID from links/tags views
- Create root-level notes
- Attachment naming rules - use filename as alt text (sans extension)
- Detect orphaned attachments
