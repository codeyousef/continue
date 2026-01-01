# Fix/Edit Spec for undefined-variable.js

## Goal

Fix all undefined variables, typos, scoping issues, type coercion problems, and missing error handling in the JavaScript file.

## Issues Found

1. **Line 4**: `quantity` is undefined - should use `item.quantity`
2. **Line 6**: Typo `totl` instead of `total`
3. **Line 11**: `result` not declared with `let/const` (implicit global)
4. **Line 12**: `temp` not declared with `let/const` (implicit global)
5. **Line 19**: `count` references itself before initialization (TDZ error)
6. **Line 23**: Unsafe property access chain that could fail if `response.data.user` is undefined
7. **Line 29**: Closure issue with `var i` - all functions return the same value (5)
8. **Line 40**: Typo `apiEnpoint` instead of `apiEndpoint`
9. **Line 41**: Typo `maxRetires` instead of `maxRetries`
10. **Line 50**: `this.name` is undefined due to lost context in setTimeout callback
11. **Line 57**: Missing return statement for empty array case
12. **Line 67**: Type coercion issue with `==` comparing string "200" to number
13. **Line 76**: Attempting to reassign `const` variable
14. **Line 82**: Accessing `myVar` before initialization (returns undefined due to hoisting)
15. **Line 83**: Accessing `myLet` before initialization (ReferenceError)
16. **Line 90**: No validation that `input` is an array or has `.map()` method

## Files to Edit

- `01-bugs-to-fix/javascript/undefined-variable.js`

## Changes Required

### calculateTotal function (lines 1-7)

- Change `item.price * quantity` to `item.price * item.quantity`
- Change `return totl` to `return total`

### processData function (lines 10-14)

- Add `const` before `result = data.map...`
- Add `const` before `temp = result.filter...`

### incrementCounter function (lines 18-21)

- Change `let count = count + 1` to use outer scope: remove `let` keyword OR rename inner variable to avoid shadowing

### getUserEmail function (lines 23-26)

- Add optional chaining: `const email = response?.data?.user?.email`
- Add fallback or validation

### createCounters function (lines 28-35)

- Change `var i` to `let i` to fix closure scope issue

### fetchData function (lines 40-43)

- Change `config.apiEnpoint` to `config.apiEndpoint`
- Change `config.maxRetires` to `config.maxRetries`

### user.greet function (lines 49-52)

- Change regular function to arrow function: `setTimeout(() => { console.log("Hello, " + this.name); }, 100);`
- OR use `.bind(this)` on the function

### findMax function (lines 56-63)

- Add `return undefined;` or `return null;` in the empty array check

### checkStatus function (lines 66-72)

- Change `if (status == "200")` to `if (status === "200")` for strict equality

### updateValue function (lines 75-78)

- Change `const value` to `let value` to allow reassignment

### hoistingExample function (lines 81-85)

- Move `console.log` statements after variable declarations OR handle the ReferenceError

### processInput function (lines 88-90)

- Add validation: `if (!Array.isArray(input)) return [];` or throw error
- Add null/undefined check
