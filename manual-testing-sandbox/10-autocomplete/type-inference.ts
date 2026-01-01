// Type Inference Tests
// Autocomplete should infer correct types from context

// ============================================
// Test 1: Infer type from function return
// ============================================

function createUser(name: string, email: string) {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
  };
}

// What type should 'user' be? Autocomplete should know
const user = createUser("John", "john@example.com");
// TODO: Type user. and see if autocomplete shows id, name, email, createdAt

// ============================================
// Test 2: Infer array element type
// ============================================

const products = [
  { id: "1", name: "Laptop", price: 999 },
  { id: "2", name: "Mouse", price: 29 },
  { id: "3", name: "Keyboard", price: 79 },
];

// TODO: Type 'products[0].' and see if properties are suggested
const firstProduct = products[0];

// ============================================
// Test 3: Infer callback parameter type
// ============================================

const numbers = [1, 2, 3, 4, 5];

// TODO: In the callback, 'n' should be inferred as number
const doubled = numbers.map((n) => {
  // n should be number - test autocomplete on n.
});

// ============================================
// Test 4: Infer from generic usage
// ============================================

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = { name: "Alice", age: 30, city: "NYC" };

// TODO: Autocomplete for second parameter should show 'name' | 'age' | 'city'
const personName = getProperty(person /* cursor here */);

// ============================================
// Test 5: Infer union type
// ============================================

type Status = "pending" | "active" | "completed" | "cancelled";

interface Task {
  id: string;
  status: Status;
}

const task: Task = {
  id: "1",
  // TODO: Autocomplete for status should show the union options
  // Place cursor after the colon and trigger autocomplete:
  status: "pending", // Try deleting this value and autocompleting
};

// ============================================
// Test 6: Infer from conditional
// ============================================

function processValue(value: string | number | null) {
  if (typeof value === "string") {
    // TODO: value should be narrowed to string here
    // Autocomplete should show string methods
    // Try typing: value. (then trigger autocomplete)
    return value.toUpperCase();
  }

  if (typeof value === "number") {
    // TODO: value should be narrowed to number here
    // Try typing: value. (then trigger autocomplete)
    return value.toFixed(2);
  }

  // TODO: value should be null here
  return value;
}

// ============================================
// Test 7: Infer from Promise
// ============================================

async function fetchData(): Promise<{ data: string[]; count: number }> {
  return { data: ["a", "b"], count: 2 };
}

async function processData() {
  const result = await fetchData();
  // TODO: result should have data and count properties
  // Try typing: result. (then trigger autocomplete)
  console.log(result.data);
}

// ============================================
// Test 8: Infer from destructuring
// ============================================

interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

function initializeClient(config: Config) {
  const { apiUrl, timeout /* TODO: autocomplete remaining properties */ } =
    config;
}

// ============================================
// Test 9: Infer method overload
// ============================================

interface EventEmitter {
  on(event: "connect", listener: () => void): this;
  on(event: "data", listener: (data: Buffer) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
}

declare const emitter: EventEmitter;

// TODO: Second parameter type should change based on first parameter
emitter.on("error", (/* autocomplete should know this is Error */) => {});

// ============================================
// Test 10: Infer from mapped type
// ============================================

type ApiEndpoints = {
  "/users": { method: "GET"; response: User[] };
  "/users/:id": { method: "GET"; response: User };
  "/products": { method: "GET"; response: Product[] };
};

type User = { id: string; name: string };
type Product = { id: string; price: number };

function apiCall<T extends keyof ApiEndpoints>(
  endpoint: T,
): Promise<ApiEndpoints[T]["response"]> {
  // Implementation
  return {} as any;
}

// TODO: Return type should be inferred correctly
const usersResponse = await apiCall("/users");
// usersResponse should be User[]
