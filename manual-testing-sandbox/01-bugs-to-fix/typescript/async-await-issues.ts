interface User {
  id: number;
  name: string;
}

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

function getUser(id: number): User {
  return fetchUser(id);
}

async function processUser(id: number) {
  const user = fetchUser(id);
  console.log(user.name);
}

async function deleteAllUsers(ids: number[]) {
  for (const id of ids) {
    deleteUser(id);
  }
  console.log("All deleted");
}

async function fetchAllUsers(ids: number[]): Promise<User[]> {
  return Promise.all(ids.map((id) => fetchUser(id)));
}

function updateUser(id: number, name: string): Promise<User> {
  const user = await fetchUser(id);
  user.name = name;
  await saveUser(user);
  return user;
}

function initializeApp() {
  fetchUsers();
  console.log("App initialized");
}

async function transferData(fromId: number, toId: number) {
  const fromUser = fetchUser(fromId);
  const toUser = fetchUser(toId);
  await saveUser(fromUser);
  await saveUser(toUser);
}

async function processAllUsers() {
  const users = await fetchUsers();
  users.forEach(async (user) => {
    await saveUser(user);
  });
  console.log("All processed");
}

async function riskyOperation() {
  const user = await fetchUser(999);
  await deleteUser(user.id);
  return user;
}

async function getMessage(): string {
  return "Hello";
}
