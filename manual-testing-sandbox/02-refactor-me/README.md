# Refactor Me

This folder contains code quality issues for testing refactoring suggestions.

## Test Scenarios

| File                      | Issue                     | Expected Refactoring           |
| ------------------------- | ------------------------- | ------------------------------ |
| `extract-function.ts`     | God function (200+ lines) | Extract into smaller functions |
| `remove-duplication.py`   | DRY violations            | Extract shared logic           |
| `class-to-functional.tsx` | React class component     | Convert to hooks               |
| `callback-to-async.js`    | Promise chains            | Convert to async/await         |
| `magic-numbers.java`      | Hardcoded values          | Extract to constants           |
| `god-class.ts`            | SOLID violations          | Split responsibilities         |

## How to Test

1. Open any file in this folder
2. Ask: "Refactor this code"
3. Verify the AI identifies code smells
4. Check that suggestions follow best practices

## Example Prompts

- "This function is too long, split it up"
- "Remove the code duplication"
- "Convert to modern syntax"
- "Apply SOLID principles"
- "Make this more readable"
