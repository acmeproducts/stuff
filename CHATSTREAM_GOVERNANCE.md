# ChatStream Governance

**Canonical application:** `chatstream.html`  
**Canonical name:** ChatStream  
**Status:** Governing product and implementation contract  
**Initial governance version:** 1.0  

## 1. Purpose

ChatStream is a multi-thread coding orchestrator. It provides a persistent workspace in which a user can organize coding work by project labels, maintain multiple independent coding threads, send iterative instructions to an execution agent, and receive pushed code plus a testable URL.

ChatStream is intentionally simpler than a workflow manager. It does not require the user to operate or track artificial phases such as idea, plan, build, test, review, or deploy. Those activities may occur internally during execution, but they are not user-managed stages.

The primary interaction is:

1. Enter or return to a project.
2. Open or create a thread.
3. Associate the thread with an existing repository file or a new output filename.
4. Describe the desired work in chat.
5. Let the execution backend modify, validate, commit, and push the code.
6. Receive the execution result and test URL.
7. Continue refining the same artifact in the same thread.

## 2. Product identity

ChatStream is a new application.

`session-manager-v3.html` is a UI/layout reference only. ChatStream may reuse or adapt its proven visual shell, responsive behavior, connection patterns, and implementation techniques, but ChatStream must not be described, versioned, or governed as a Session Manager release.

The following names are obsolete for this application and must not be reintroduced:

- DevStream
- `devstream.html`
- Session Dash Manager v4
- Session Manager successor

The application filename is `chatstream.html`.

## 3. Core domain model

### 3.1 Project

A project is a user-created organizational label. It is not required to map to a repository, branch, folder, deployment, agent, or workflow.

A project contains zero or more threads.

### 3.2 Thread

A thread is the durable unit of work and the primary unit of orchestration.

Each thread has an immutable internal thread ID. The filename displayed on a tab is not the thread identity.

A thread contains, at minimum:

- immutable thread ID;
- project ID;
- display title;
- repository binding;
- branch binding;
- optional input/source filename;
- primary output filename;
- persistent conversation history;
- optional execution-backend session binding;
- execution history and latest execution state;
- last-touched timestamp;
- optional notes;
- test URL when available.

### 3.3 Input/source file

A thread may start from an existing repository file. This file is the input/source file.

For normal in-place editing, input and output filenames may be the same.

For a fork or derived artifact, input and output filenames may differ.

For a new idea, the input filename may be null.

### 3.4 Output file

Every executable thread must have one primary output filename before a build is dispatched.

The output filename is sticky: follow-up instructions in the thread continue to target the same output file unless the user explicitly changes it.

The execution agent may modify secondary files when necessary to complete the requested change, but that does not remove the concept of one primary output artifact for the thread.

### 3.5 Conversation

The thread conversation is the user-facing control surface. Follow-up requirements, bug reports, refinements, filename changes, and execution feedback are entered in the same continuous conversation.

Conversation history is durable ChatStream state and must not depend solely on the lifetime of an OpenClaw process or session.

## 4. New-thread interaction contract

Creating a thread must remain lightweight.

The UI must support:

- omni-search over existing files in the selected repository;
- selecting an existing file as the starting artifact;
- entering a new output filename directly;
- optionally specifying a different source/input filename;
- entering the initial prompt/idea.

If the user supplies an idea but no output filename, ChatStream must require the output filename before build execution. It must not invent a filename silently.

Selecting an existing file should default to in-place editing:

- `inputFile = selected file`
- `outputFile = selected file`

The user may change the output filename to create a derived artifact.

## 5. Execution contract

A successful execution outcome is not merely an agent response. It is:

- code changes completed;
- requested validation performed where possible;
- code committed and pushed to the configured repository;
- execution result recorded;
- testable URL returned when the repository/deployment configuration permits one.

The recommended execution lifecycle is:

`refresh source -> snapshot/base SHA -> execute -> validate -> commit -> push -> verify -> report`

The user must not be forced to operate this lifecycle as a visible workflow.

Before modifying a file, the execution path must refresh or verify the current GitHub revision/SHA so a stale browser or stale agent context does not silently overwrite newer work.

## 6. OpenClaw boundary

OpenClaw is the default execution/orchestration backend, not ChatStream's primary database.

ChatStream may bind a thread to an OpenClaw session so that execution can continue efficiently, but the durable ChatStream thread definition, conversation record, execution summary, notes, and file bindings must remain recoverable from GitHub-backed ChatStream state.

OpenClaw is responsible for work such as:

- agent selection/routing;
- coding and file modification;
- tool use;
- tests and validation;
- Git operations when delegated;
- run streaming;
- cancellation;
- transient reasoning/work state.

ChatStream is responsible for:

- project organization;
- thread identity and bindings;
- durable user-visible conversation;
- durable execution results;
- cross-device workspace state;
- dashboard/status aggregation.

A future execution connector may replace or supplement OpenClaw without requiring a redesign of the ChatStream domain model.

## 7. GitHub persistence and multi-device synchronization

GitHub is the durable source of truth for ChatStream workspace state.

The synchronization mechanism must be conflict-aware. A device must not assume that the state file or branch head is unchanged merely because its local browser copy is unchanged.

Preferred synchronization characteristics:

- immutable event IDs or mergeable records;
- remote read before publish;
- expected SHA/base-head validation;
- non-force branch updates;
- bounded retry on a legitimate concurrent update;
- deterministic merge/deduplication;
- local outbox for changes awaiting synchronization;
- receive-on-load/focus plus periodic receive while active.

This follows the established GitHub SOT approach used elsewhere in the repository: remote state is merged with locally pending changes and a publish is rejected/retried if the branch or state object moved before write.

Browser-local storage may cache settings, credentials, device identity, and pending synchronization data, but browser-local storage is not the canonical workspace.

### Privacy requirement

ChatStream state contains conversation and project metadata. The visibility of the configured GitHub state repository therefore determines the visibility of that information. A public state repository makes that state public. ChatStream must make this explicit in Settings and must support storing state in a different repository from the code repository.

## 8. Dashboard governance

The first card in the left navigation is **Dashboard**.

Dashboard is the global operational view across all projects and threads. It is what makes ChatStream an orchestrator rather than merely a tabbed chat client.

Dashboard must be able to show:

- every project/thread;
- current execution state;
- last-touched time;
- current/last execution summary;
- attention/error indication;
- notes where relevant;
- direct navigation into the owning project/thread.

Core execution states are intentionally small:

- queued;
- running;
- waiting;
- completed;
- error;
- cancelled.

`attentionRequired` is separate from execution state so a successfully completed run can still require user attention.

Dashboard should support filtering and sorting without introducing workflow columns or stage management.

## 9. State versus result

Execution state must be derived from objective run/session events and durable execution records, not from arbitrary agent prose.

Each execution record should preserve enough information to audit what happened, including when available:

- execution ID;
- thread ID;
- start/end timestamps;
- base SHA;
- result commit SHA;
- status;
- validation result;
- changed files;
- error summary;
- test URL.

The latest agent message is not the authoritative execution state.

## 10. Security and credentials

No GitHub PAT, OpenClaw shared token, vendor API key, or other secret may be hard-coded into `chatstream.html` or committed ChatStream state.

Because GitHub Pages is static hosting, any secret shipped in the HTML is public to the browser and must be treated as compromised.

Device-local credentials may be stored only through explicit configuration and must not be synchronized into the GitHub state document.

OpenClaw should own downstream model/provider credentials whenever OpenClaw is the execution backend.

## 11. UI governance

The Session Manager v3 visual shell is the reference for ChatStream's layout:

- project/navigation surface on the left;
- thread tabs and conversation on the right;
- responsive/mobile-friendly behavior;
- clear active/running/error indications;
- settings behind the gear/control surface.

However, ChatStream terminology and behavior must remain native to ChatStream.

The normal user should not need to understand agents, Git internals, SHA values, event logs, synchronization algorithms, or execution phases to use the product.

Advanced/debug surfaces may expose those details for diagnosis.

## 12. Scope test

A proposed feature belongs in ChatStream only when it materially improves one or more of these five capabilities:

1. **Organize** — projects and threads.
2. **Bind** — repository, branch, source file, and primary output file.
3. **Discuss** — persistent thread conversation and refinement.
4. **Execute** — dispatch, observe, cancel, validate, push, and return a test URL.
5. **Observe** — global dashboard, status, attention, recency, notes, and navigation.

Features that primarily introduce workflow administration, kanban stages, process ceremony, or duplicated agent-provider configuration should be rejected unless a concrete ChatStream requirement cannot be met without them.

## 13. Non-goals

ChatStream is not:

- a kanban board;
- a project-management workflow engine;
- a forced SDLC stage tracker;
- a replacement for GitHub source control;
- a replacement for OpenClaw's execution engine;
- a repository-per-project abstraction;
- a permanently running agent per tab;
- a Session Manager release.

## 14. Versioning and change control

The visible application must display its ChatStream build version.

Material changes to the domain model, persistence model, execution boundary, or security boundary require an update to this governance document in the same change set or before implementation.

UI refinements and bug fixes that do not change those contracts do not require a governance revision.

When implementation convenience conflicts with this document, the governance contract wins unless it is explicitly revised.
