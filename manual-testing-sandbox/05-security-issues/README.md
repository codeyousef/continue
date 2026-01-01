# Security Issues

This folder contains intentional security vulnerabilities for testing detection.

⚠️ **WARNING**: These files contain intentionally vulnerable code for testing purposes only. Do NOT use in production.

## Test Scenarios

| File                    | Vulnerability Type   | Severity |
| ----------------------- | -------------------- | -------- |
| `sql-injection.py`      | SQL Injection        | Critical |
| `xss-vulnerability.tsx` | Cross-Site Scripting | High     |
| `hardcoded-secrets.ts`  | Exposed Credentials  | Critical |
| `path-traversal.js`     | Path Traversal       | High     |
| `insecure-auth.ts`      | Weak Authentication  | High     |

## How to Test

1. Open any file in this folder
2. Ask: "Find security vulnerabilities in this code"
3. Verify the AI identifies all vulnerabilities
4. Ask: "How do I fix these security issues?"

## Example Prompts

- "Audit this code for security issues"
- "Is this code secure?"
- "Find all vulnerabilities"
- "How can this be exploited?"
- "Make this code secure"
