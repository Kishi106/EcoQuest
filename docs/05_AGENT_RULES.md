# AI Agent Rules

**Project:** EcoQuest: Sustainable Future

**Document ID:** AGENT-001

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the behavior and responsibilities of AI coding agents working on EcoQuest.

The objective is to ensure that all AI-generated code follows the project's architecture, coding standards, and documentation without introducing inconsistent or undocumented changes.

Every AI assistant contributing to the project must follow these rules.

---

# 2. General Principles

The AI agent shall:

- Follow all project documentation.
- Respect existing architecture.
- Preserve project consistency.
- Generate maintainable code.
- Avoid unnecessary complexity.
- Never make undocumented assumptions.

---

# 3. Documentation Priority

When making implementation decisions, follow documents in this order:

1. Software Design Specification (SDS)
2. Technical Design Documents (Future)
3. Game Design Document (GDD)
4. Source Code
5. User Instructions

Higher-priority documents always override lower-priority ones.

---

# 4. Source of Truth

The documentation is the source of truth.

If generated code conflicts with documentation:

- Documentation takes priority.
- The AI should never silently change documented behavior.

---

# 5. Coding Standards

The AI must follow:

- CodingStandards.md
- FolderStructure.md
- Architecture.md

Naming conventions, formatting, and project organization must remain consistent.

---

# 6. File Organization

The AI shall:

- Place files in the correct folders.
- Avoid duplicate implementations.
- Reuse existing systems whenever possible.
- Never create unnecessary folders.

---

# 7. Documentation Updates

Whenever a major feature changes:

- Update the relevant documentation.
- Keep documentation synchronized with code.

The AI must never allow documentation to become outdated.

---

# 8. Modifying Existing Code

Before changing existing code:

- Understand the current implementation.
- Preserve existing functionality.
- Avoid breaking unrelated systems.

Small, focused changes are preferred over large rewrites.

---

# 9. Creating New Systems

Before creating a new system, verify:

- The system does not already exist.
- The feature is documented.
- The architecture supports the addition.

Do not duplicate functionality.

---

# 10. Error Handling

Generated code should:

- Validate inputs.
- Handle expected failures.
- Fail gracefully.
- Avoid application crashes.

Errors should provide meaningful messages for debugging.

---

# 11. Performance

The AI should:

- Avoid unnecessary calculations.
- Minimize memory allocations.
- Prevent repeated expensive operations.
- Keep simulation performance stable.

Optimization should not reduce readability.

---

# 12. Security

Never:

- Hardcode secrets.
- Expose API keys.
- Bypass authentication.
- Store sensitive information in source code.

Security rules defined in the SDS must always be followed.

---

# 13. Dependencies

Before adding a dependency:

- Verify it is necessary.
- Prefer built-in functionality.
- Avoid duplicate libraries.
- Minimize project size.

New dependencies require approval.

---

# 14. Refactoring

Refactoring should:

- Improve readability.
- Preserve behavior.
- Avoid unnecessary changes.
- Maintain compatibility.

Large refactors should be divided into smaller tasks.

---

# 15. Testing

After implementing a feature:

- Verify functionality.
- Ensure no compilation errors.
- Check for regressions.
- Follow Testing.md guidelines.

Code should not be considered complete without validation.

---

# 16. Git Practices

When generating commit messages:

- Use clear descriptions.
- Keep commits focused.
- Avoid unrelated changes.

Example:

```
Add climate simulation update scheduler
```

---

# 17. Forbidden Actions

The AI must never:

- Delete unrelated files.
- Rewrite entire systems unnecessarily.
- Ignore project documentation.
- Introduce breaking changes without notice.
- Change architecture without approval.
- Remove comments or documentation without reason.

---

# 18. Preferred Development Workflow

For every task:

1. Read relevant documentation.
2. Understand existing code.
3. Plan implementation.
4. Make minimal changes.
5. Validate functionality.
6. Update documentation if needed.

---

# 19. Communication

When completing a task, the AI should summarize:

- Files modified.
- Features added.
- Bugs fixed.
- Potential risks.
- Suggested next steps.

This helps developers review generated work.

---

# 20. Future Expansion

These rules apply to:

- ChatGPT
- Anigravity
- Cursor
- GitHub Copilot
- Claude Code
- Future AI coding assistants

Additional rules may be added as the project evolves.

---

# 21. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial AI agent rules created. |

---

# 22. Approval

| Role | Status |
|------|--------|
| Project Lead | Approved |
| Technical Lead | Approved |
| Documentation | Approved |

---

**End of Document**