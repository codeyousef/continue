# Bugs to Fix

This folder contains intentional bugs for testing error detection and fix suggestions.

## Test Scenarios

| File                               | Bug Type                          | Expected AI Action                       |
| ---------------------------------- | --------------------------------- | ---------------------------------------- |
| `typescript/null-reference.ts`     | Null/undefined access             | Suggest optional chaining or null checks |
| `typescript/type-mismatch.ts`      | Type errors                       | Fix type annotations                     |
| `typescript/async-await-issues.ts` | Missing await, unhandled promises | Add missing awaits                       |
| `python/index-error.py`            | List index out of range           | Add bounds checking                      |
| `python/exception-handling.py`     | Unhandled exceptions              | Add try/catch blocks                     |
| `javascript/undefined-variable.js` | ReferenceError                    | Declare missing variables                |
| `javascript/callback-hell.js`      | Callback pyramid                  | Convert to async/await                   |
| `rust/borrow-checker.rs`           | Ownership errors                  | Fix borrow issues                        |

## How to Test

1. Open any file in this folder
2. Ask: "Fix the bugs in this file"
3. Verify the AI identifies all intentional bugs
4. Check that suggested fixes are correct

## Example Prompts

- "What bugs are in this file?"
- "Fix all the errors"
- "This code crashes, why?"
- "Make this code safe"
