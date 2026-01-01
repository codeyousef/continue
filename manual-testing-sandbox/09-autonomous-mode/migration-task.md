# Migration Task: Callback to Async/Await

## Task Description

Migrate all callback-based asynchronous code in the target module to modern async/await syntax.

## Target Files

Create and then migrate the following file with intentional callback patterns:

### File to Create: `callback-legacy.ts`

```typescript
// Legacy callback-based code that needs migration

import * as fs from "fs";
import * as https from "https";

type Callback<T> = (error: Error | null, result?: T) => void;

interface User {
  id: string;
  name: string;
  email: string;
}

interface ApiResponse {
  data: unknown;
  status: number;
}

// Database simulation with callbacks
function findUserById(id: string, callback: Callback<User>): void {
  setTimeout(() => {
    if (id === "invalid") {
      callback(new Error("User not found"));
    } else {
      callback(null, { id, name: "John Doe", email: "john@example.com" });
    }
  }, 100);
}

function saveUser(user: User, callback: Callback<User>): void {
  setTimeout(() => {
    if (!user.email) {
      callback(new Error("Email is required"));
    } else {
      callback(null, { ...user, id: `user_${Date.now()}` });
    }
  }, 100);
}

function deleteUser(id: string, callback: Callback<boolean>): void {
  setTimeout(() => {
    callback(null, true);
  }, 50);
}

// File operations with callbacks
function readConfig(path: string, callback: Callback<object>): void {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      callback(err);
    } else {
      try {
        callback(null, JSON.parse(data));
      } catch (parseError) {
        callback(parseError as Error);
      }
    }
  });
}

function writeConfig(
  path: string,
  config: object,
  callback: Callback<void>,
): void {
  const data = JSON.stringify(config, null, 2);
  fs.writeFile(path, data, "utf8", (err) => {
    callback(err);
  });
}

// API calls with callbacks
function fetchUserData(userId: string, callback: Callback<ApiResponse>): void {
  const options = {
    hostname: "api.example.com",
    path: `/users/${userId}`,
    method: "GET",
  };

  const req = https.request(options, (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      try {
        callback(null, {
          data: JSON.parse(body),
          status: res.statusCode || 200,
        });
      } catch (e) {
        callback(e as Error);
      }
    });
  });

  req.on("error", callback);
  req.end();
}

// Complex nested callbacks (callback hell)
function processUserWorkflow(userId: string, callback: Callback<string>): void {
  findUserById(userId, (err, user) => {
    if (err) {
      callback(err);
      return;
    }

    fetchUserData(userId, (err, apiData) => {
      if (err) {
        callback(err);
        return;
      }

      const updatedUser = { ...user!, lastSync: new Date() };

      saveUser(updatedUser, (err, savedUser) => {
        if (err) {
          callback(err);
          return;
        }

        readConfig("./config.json", (err, config) => {
          if (err) {
            callback(err);
            return;
          }

          const newConfig = { ...config, lastUser: savedUser!.id };

          writeConfig("./config.json", newConfig, (err) => {
            if (err) {
              callback(err);
              return;
            }

            callback(null, `Processed user ${savedUser!.id} successfully`);
          });
        });
      });
    });
  });
}

// Parallel operations with callbacks
function fetchMultipleUsers(ids: string[], callback: Callback<User[]>): void {
  const results: User[] = [];
  let completed = 0;
  let hasError = false;

  if (ids.length === 0) {
    callback(null, []);
    return;
  }

  ids.forEach((id, index) => {
    findUserById(id, (err, user) => {
      if (hasError) return;

      if (err) {
        hasError = true;
        callback(err);
        return;
      }

      results[index] = user!;
      completed++;

      if (completed === ids.length) {
        callback(null, results);
      }
    });
  });
}

// Export for use
export {
  findUserById,
  saveUser,
  deleteUser,
  readConfig,
  writeConfig,
  fetchUserData,
  processUserWorkflow,
  fetchMultipleUsers,
};
```

## Requirements

### 1. Convert All Functions to Async/Await

Transform each function from callback-based to Promise-based with async/await:

```typescript
// Before
function findUserById(id: string, callback: Callback<User>): void;

// After
async function findUserById(id: string): Promise<User>;
```

### 2. Handle Errors Properly

- Replace callback error handling with try/catch blocks
- Ensure all errors are properly typed
- Add custom error classes where appropriate

### 3. Flatten Callback Hell

The `processUserWorkflow` function has deeply nested callbacks. Refactor to:

- Linear async/await flow
- Proper error handling at each step
- Optional: Extract sub-operations into helper functions

### 4. Convert Parallel Operations

Transform `fetchMultipleUsers` to use `Promise.all()`:

```typescript
async function fetchMultipleUsers(ids: string[]): Promise<User[]> {
  return Promise.all(ids.map((id) => findUserById(id)));
}
```

### 5. Maintain Backward Compatibility (Optional)

Create wrapper functions that provide callback interface for legacy code:

```typescript
function findUserByIdLegacy(id: string, callback: Callback<User>): void {
  findUserById(id)
    .then((user) => callback(null, user))
    .catch((err) => callback(err));
}
```

## Acceptance Criteria

- [ ] All functions converted to async/await
- [ ] No more callback parameters in function signatures
- [ ] Callback hell in processUserWorkflow is flattened
- [ ] Parallel operations use Promise.all
- [ ] Error handling is comprehensive
- [ ] TypeScript compiles without errors
- [ ] Code is readable and maintainable

## Hints for the Agent

1. Start with leaf functions (no dependencies)
2. Work your way up to complex functions
3. Use `util.promisify` for Node.js built-in callback functions
4. Consider using `fs.promises` for file operations
5. Test each function after migration before moving on

## Expected Final Result

```typescript
// Clean async/await code

async function processUserWorkflow(userId: string): Promise<string> {
  const user = await findUserById(userId);
  const apiData = await fetchUserData(userId);

  const updatedUser = { ...user, lastSync: new Date() };
  const savedUser = await saveUser(updatedUser);

  const config = await readConfig("./config.json");
  const newConfig = { ...config, lastUser: savedUser.id };
  await writeConfig("./config.json", newConfig);

  return `Processed user ${savedUser.id} successfully`;
}
```
