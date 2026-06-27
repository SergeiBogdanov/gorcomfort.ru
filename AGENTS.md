# Project Instructions

- Do not use a browser or in-app browser to independently inspect or verify this project. If visual verification is needed, ask the user to review the page or provide a screenshot.

## Notion Task Workflow

These instructions describe how Codex should work with the Gorcomfort.ru Notion task board in this chat.

### Board

- Use the Notion board "Gorcomfort.ru Task List" when the user explicitly asks to work with Notion tasks.
- The task status property is `Status`.
- The relevant statuses are:
  - `Backlog`
  - `Doing`
  - `Testing`
  - the Done status, named `Done` with the celebration emoji in Notion

### When To Start Work

- Do not start implementing tasks just because the board is available.
- Start working on Notion tasks only after an explicit user command, for example: "work on tasks from Doing".
- If the user only updates the process, asks a question, or gives future instructions, acknowledge the instruction and do not begin implementation.

### Picking Tasks

- Work only on tasks in `Doing`.
- Ignore `Backlog`, `Testing`, and the Done status unless the user explicitly asks otherwise.
- Process `Doing` tasks one by one.
- Prefer the visible top-to-bottom order from the board when it is available.
- If board order is not available through the connector, use the numeric prefix at the beginning of the task title: lower number first.
- Before implementing a task, fetch and read the task card content. The title is not enough; the description inside the card defines the work.
- If the connector cannot reliably list `Doing` tasks, ask the user for the current `Doing` task links or titles instead of guessing.

### Completing Tasks

- After a task is implemented and locally verified as far as possible, update its `Status` to `Testing`.
- When moving a task to `Testing`, add a short testing note inside the card: briefly describe what the user should pay attention to while testing.
- Keep the testing note concise. Do not write a detailed report unless the user asks for one.
- Do not move tasks from `Testing` to the Done status; the user handles that.
- Do not move tasks from `Backlog` to `Doing`; the user handles that.
- In the final response, summarize what was done, what was checked, which Notion card was moved to `Testing`, and mention that a short testing note was added.

### Adding Tasks

- Add new tasks only when the user explicitly asks.
- New tasks should be created in `Backlog` unless the user specifies another status.
- Each task must have:
  - A clear title in the `Name` property.
  - A useful description inside the card explaining what should be changed, where relevant, and any acceptance criteria or context.
- Keep task descriptions practical and implementation-oriented.

### Verification

- Do not use a browser or in-app browser to inspect or verify the project independently.
- Use local code inspection and available non-browser checks.
- If visual verification is needed, ask the user to review the page or provide a screenshot.

### Git And Existing Changes

- Be careful with dirty working trees.
- Do not revert or overwrite existing user changes unless the user explicitly asks.
- Keep edits scoped to the current Notion task.
