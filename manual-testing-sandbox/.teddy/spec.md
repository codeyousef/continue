# Fix Spec: undefined-variable.js

## Goal

Fix all undefined variable issues, missing declarations, and incorrect variable references in the JavaScript file.

## Issues Found

1. **Line 4**: Comment mentions 'quantity' is not defined, but code appears correct - remove misleading comment
2. **Line 6**: Comment mentions typo 'totl' but code shows 'total' - remove misleading comment
3. **Line 10**: `result` is not declared with `let`, `const`, or `var` (implicit global)
4. **Line 11**: `temp` is not declared with `let`, `const`, or `var` (implicit global)
5. **Line 17**: Comment mentions "References undefined inner 'count'" but there's no shadowing issue - this code is actually correct, remove misleading comment
6. **Line 56**: Missing return statement when `numbers.length === 0`, explicitly return undefined or a default value

## Files to Edit

- `01-bugs-to-fix/javascript/undefined-variable.js`

## Changes Required

### File: `01-bugs-to-fix/javascript/undefined-variable.js`

1. **Line 4**: Remove the misleading comment `// 'quantity' is not defined` (the code is correct as-is)

2. **Line 6**: Remove the misleading comment `// Typo: 'totl' instead of 'total'` (the code is correct as-is)

3. **Line 10**: Add `const` declaration before `result`:

   ```javascript
   const result = data.map((x) => x * 2);
   ```

4. **Line 11**: Add `const` declaration before `temp`:

   ```javascript
   const temp = result.filter((x) => x > 10);
   ```

5. **Line 17**: Remove the misleading comment `// References undefined inner 'count'` (the code correctly references the outer scope variable)

6. **Line 56-57**: Add explicit return statement for the empty array case:
   ```javascript
   if (numbers.length === 0) {
     return undefined; // or return null, or return -Infinity depending on requirements
   }
   ```
