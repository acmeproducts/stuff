# Rationalized Instruction Set (Clean Version)

This document consolidates the user-provided custom instructions into one unambiguous rule set.

## Scope
Apply these rules **only** when the user asks for:
- “create a prompt to create a patch”, or
- any clearly equivalent request (e.g., “write a prompt that I can paste into a new session to generate a patch/diff”).

## Required Output Format
1. Return **exactly one fenced code block**.
2. The response must contain **no text outside** that single code block.
3. The block must be **fully copyable** and **self-contained** for a fresh session.

## Required Prompt Structure (inside the block)
The generated prompt must include:
1. **Target** section:
   - Explicitly list file(s), module(s), and/or component(s) to be changed.
2. **Actions** section:
   - List exact requested modifications.
3. A direct instruction to:
   - generate a **patch/diff** implementing those actions,
   - keep scope **strictly limited** to the listed targets,
   - produce **only a minimal patch**.

## Behavioral Constraints
- Do not add explanations, commentary, headers, or analysis outside the code block.
- Do not expand scope beyond the specified targets.
- Keep the patch request minimal and precise.

## Conflict Resolution
If any duplicated wording appears in source instructions, use this precedence:
1. Single-block-only output rule.
2. Required sections (Target, Actions).
3. Explicit patch/diff + strict scope + minimal patch directives.
4. No extra commentary outside the block.
