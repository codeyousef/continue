// BUG FILE: Intentional async/await issues for testing

interface User {
  id: number;
  name: string;
}

// Simulated async functions
async function fetchUser(id: number): Promise<User> {
  return { id, name: `User ${id}` };
}

async function fetchUsers(): Promise<User[]> {
  return [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];
}

async function saveUser(user: User): Promise<void> {
  console.log("Saved:", user);
}

async function deleteUser(id: number): Promise<boolean> {
  return true;
}

// BUG 1: Missing await - returns Promise instead of User
function getUser(id: number): User {
  return fetchUser(id); // Missing await, returns Promise<User>
}

// BUG 2: Missing await in assignment
async function processUser(id: number) {
  const user = fetchUser(id); // Missing await
  console.log(user.name); // user is a Promise, not User
}

// BUG 3: Unhandled promise in loop
async function deleteAllUsers(ids: number[]) {
  for (const id of ids) {
    deleteUser(id); // Missing await - fires and forgets
  }
  console.log("All deleted"); // Logs before deletions complete
}

// BUG 4: Promise.all without await
async function fetchAllUsers(ids: number[]): Promise<User[]> {
  return Promise.all(ids.map((id) => fetchUser(id))); // Should await
}

// BUG 5: Missing async keyword
function updateUser(id: number, name: string): Promise<User> {
  const user = await fetchUser(id); // await in non-async function
  user.name = name;
  await saveUser(user);
  return user;
}

// BUG 6: Floating promise (no await, no .then, no .catch)
function initializeApp() {
  fetchUsers(); // Promise ignored
  console.log("App initialized");
}

// BUG 7: Race condition - parallel when should be sequential
async function transferData(fromId: number, toId: number) {
  const fromUser = fetchUser(fromId); // Not awaited
  const toUser = fetchUser(toId); // Not awaited
  // These run in parallel but might need sequential
  await saveUser(fromUser); // fromUser is Promise, not User
  await saveUser(toUser);
}

// BUG 8: forEach doesn't wait for async callbacks
async function processAllUsers() {
  const users = await fetchUsers();
  users.forEach(async (user) => {
    await saveUser(user); // forEach doesn't wait for this
  });
  console.log("All processed"); // Logs immediately, not after saves
}

// BUG 9: Missing error handling on async
async function riskyOperation() {
  const user = await fetchUser(999); // Could throw, not caught
  await deleteUser(user.id);
  return user;
}

// BUG 10: Async function without await (useless async)
async function getMessage(): string {
  return "Hello"; // No await needed, async is pointless
}
