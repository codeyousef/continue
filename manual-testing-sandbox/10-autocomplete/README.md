# 10 - Autocomplete Testing

This folder contains files with incomplete code designed to test the **autocomplete** feature.
Each file has strategic gaps where the AI should provide intelligent completions.

## Purpose

Test that autocomplete can:

- Complete function bodies based on signature and comments
- Suggest appropriate types
- Continue patterns established in the code
- Handle multi-line completions
- Respect project conventions

## Test Files

### By Completion Type

| File                      | Type                | Description                              |
| ------------------------- | ------------------- | ---------------------------------------- |
| `function-bodies.ts`      | Function completion | Complete implementations from signatures |
| `type-inference.ts`       | Type completion     | Infer types from usage                   |
| `pattern-continuation.ts` | Pattern matching    | Continue established patterns            |
| `imports-exports.ts`      | Module completion   | Complete import/export statements        |
| `api-calls.py`            | Python completion   | HTTP client patterns                     |
| `react-components.tsx`    | JSX completion      | React component patterns                 |

## Usage

1. Open any file in this folder
2. Place cursor at a `// TODO:` or incomplete line
3. Trigger autocomplete (Ctrl+Space or wait for automatic)
4. Evaluate the suggestion quality

## Evaluation Criteria

- **Relevance**: Does completion make sense in context?
- **Correctness**: Is the suggested code syntactically valid?
- **Completeness**: Does it provide enough code to be useful?
- **Style**: Does it match the surrounding code style?
- **Performance**: Is the suggestion fast enough?

## Test Scenarios

### Easy

- Variable name completion
- Method chaining
- Import paths

### Medium

- Function body from signature + JSDoc
- Type annotations
- Control flow completion

### Hard

- Multi-file context awareness
- Complex type inference
- Algorithm implementation
