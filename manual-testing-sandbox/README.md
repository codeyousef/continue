# Manual Testing Sandbox for Teddy.Codes

This folder contains structured test scenarios for manually testing the AI coding assistant extension.

## How to Use

1. Open this folder in VS Code with the extension installed (F5 debug mode)
2. Navigate to the appropriate scenario folder
3. Use the scenarios to test specific features

## Test Scenarios

| Folder                   | Tests Feature            | Example Prompts                     |
| ------------------------ | ------------------------ | ----------------------------------- |
| `01-bugs-to-fix/`        | Error detection & fixing | "Fix the bugs in this file"         |
| `02-refactor-me/`        | Code refactoring         | "Refactor this to use async/await"  |
| `03-add-tests/`          | Test generation          | "Write unit tests for this service" |
| `05-security-issues/`    | Security analysis        | "Find security vulnerabilities"     |
| `07-multi-file-project/` | @codebase, @file         | "Find all usages of UserService"    |
| `09-autonomous-mode/`    | Agent mode               | "Implement this feature request"    |
| `10-autocomplete/`       | Autocomplete             | (Type and observe suggestions)      |

## Context Provider Testing

### @file

```
@file:07-multi-file-project/src/models/User.ts
Explain this model and find where it's used
```

### @codebase

```
@codebase
How does the order processing flow work?
```

### @terminal

```
@terminal
What was the output of my last build?
```

### @git

```
@git
Summarize recent changes to the UserService
```

## Quick Test Checklist

- [ ] Chat responds with code context
- [ ] @file mentions work correctly
- [ ] @codebase searches find relevant code
- [ ] Autocomplete suggests appropriate completions
- [ ] Error detection highlights issues
- [ ] Code actions suggest fixes
- [ ] Test generation creates valid tests
- [ ] Documentation generation is accurate
- [ ] Autonomous mode executes multi-step tasks
- [ ] Multi-language support works (test 3+ languages)

## Folder Details

### 01-bugs-to-fix

Intentional bugs for testing "fix this" prompts:

- Null reference errors
- Type mismatches
- Async/await issues
- Index out of bounds
- Unhandled exceptions

### 02-refactor-me

Code quality scenarios:

- Long functions to extract
- DRY violations
- React class → hooks conversion
- Callback → async/await migration
- SOLID principle violations

### 03-add-tests

Empty or partial test files alongside implementations:

- Calculator with basic tests to extend
- User service needing full coverage
- React component needing tests

### 05-security-issues

Common vulnerabilities:

- SQL injection
- XSS vulnerabilities
- Hardcoded secrets
- Path traversal

### 07-multi-file-project

Realistic e-commerce backend structure for cross-file testing:

- Models (User, Product, Order)
- Services with business logic
- Controllers for API endpoints
- Shared utilities

### 09-autonomous-mode

Multi-step task specifications:

- Feature requests
- Migration tasks
- New project scaffolding

### 10-autocomplete

Partial code for autocomplete testing:

- Function signatures to complete
- Class methods to fill in
- Import statements to suggest
