# SOT Graveyard Addendum — AI Task Instance Regressions

**Decision date:** 2026-09-28

Rejected and must not return:

- hiding the canned AI task catalog merely because one task instance is selected, running, or completed;
- treating a canned task type as a singleton that prevents another instance of the same type from being launched with different current input/scope;
- reusing one task record as the only history for repeated executions of the same canned task type;
- blocking unrelated AI task instances because another task instance is running;
- AI results that can only be viewed in the application and cannot be exported.

Required replacement: permanent **New AI task (+)** access to the full canned catalog; a fresh durable task ID and current scope snapshot for every launch; independent concurrent task instances, including the same canned task type; persistent historical task cards; and per-task **Markdown / JSON** download.
