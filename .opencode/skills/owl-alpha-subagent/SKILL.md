---
name: owl-alpha-subagent
description: Use ALWAYS when launching subagents (Task tool). Ensures subagents use Owl Alpha (openrouter/owl-alpha) instead of any other model. This skill should be loaded before ANY subagent invocation.
---

# Owl Alpha Subagent

**When invoking any subagent via the Task tool, you MUST use `openrouter/owl-alpha` as the model.**

Never use Claude Haiku, Claude Sonnet, or any other model for subagents. Owl Alpha is the project's preferred free model for all subagent work.

## Rules

- **Always** set `model: "openrouter/owl-alpha"` when calling the `task` tool.
- Never default to built-in or other provider models for subagents.
- This applies to ALL subagent types: `general`, `explore`, and any other subagent invocation.
