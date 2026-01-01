## Fix/Edit Spec for callback-hell.js

### 1. Goal

Refactor deeply nested callbacks (callback hell/pyramid of doom) to modern async/await syntax for better readability and maintainability.

### 2. Issues Found

- **Callback Hell (5+ levels deep)**: Deeply nested callbacks in `processUserData()` making code unreadable and hard to maintain
- **Error handling scattered**: Error handling is inconsistent and spread across multiple callback levels
- **Incomplete function**: `initializeDatabase()` function is cut off/incomplete
- **No error handling on HTTPS requests**: Missing error handlers for network requests
- **Race condition potential**: `orderDetails` array population relies on index ordering but async completion order isn't guaranteed
- **Manual Promise wrapping needed**: Using callback-based APIs that need modernization

### 3. Files to Edit

- `01-bugs-to-fix/javascript/callback-hell.js`

### 4. Changes Required

**For `callback-hell.js`:**

1. **Convert HTTPS requests to Promises**: Create helper function `httpsGet(url)` that returns a Promise wrapping the https.get callback pattern with proper error handling

2. **Convert fs operations to Promises**: Use `fs.promises` API or create Promise wrappers for `fs.writeFile` and `fs.readFile`

3. **Refactor `processUserData()` to async/await**:

   - Change function signature to `async function processUserData(userId)`
   - Remove callback parameter, return Promise instead
   - Use `await httpsGet()` for user data fetch
   - Use `await httpsGet()` for orders data fetch
   - Use `Promise.all()` with `orders.map()` to fetch all order details in parallel
   - Use `await fs.promises.writeFile()` for saving file
   - Use `await fs.promises.readFile()` for reading file back
   - Wrap entire function body in try-catch for centralized error handling

4. **Complete/fix `initializeDatabase()` function**:

   - Either complete the function with async/await pattern or remove it as it's incomplete
   - If completing: convert to async/await with proper Promise-based database connection

5. **Add proper error handling**: Wrap async operations in try-catch blocks and propagate errors appropriately

6. **Add usage example**: Include example at bottom showing how to call the refactored async functions with `.then()/.catch()` or in an async context
