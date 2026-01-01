// BUG FILE: Intentional null reference errors for testing

interface User {
  id: number;
  name: string;
  profile?: {
    email: string;
    avatar?: string;
    preferences?: {
      theme: string;
      notifications: boolean;
    };
  };
}

interface ApiResponse {
  data?: User[];
  error?: string;
}

// BUG 1: Accessing nested optional properties without checks
function getUserTheme(user: User): string {
  return user.profile.preferences.theme; // Will crash if profile or preferences is undefined
}

// BUG 2: Not checking if array exists before mapping
function processUsers(response: ApiResponse): string[] {
  return response.data.map((u) => u.name); // Will crash if data is undefined
}

// BUG 3: Assuming array always has elements
function getFirstUser(users: User[]): User {
  return users[0]; // Will return undefined if array is empty
}

// BUG 4: Not handling null return from find
function getUserById(users: User[], id: number): string {
  const user = users.find((u) => u.id === id);
  return user.name; // Will crash if user not found
}

// BUG 5: Destructuring without defaults
function displayUser(user: User) {
  const {
    profile: { email, avatar },
  } = user; // Will crash if profile is undefined
  console.log(`${email} - ${avatar}`);
}

// BUG 6: Chained method calls on potentially null values
function getAvatarUrl(user: User): string {
  return user.profile.avatar.toUpperCase(); // Multiple potential null issues
}

// BUG 7: Array access without bounds check
function getSecondPreference(prefs: string[]): string {
  return prefs[1].toLowerCase(); // May be undefined, then crash on toLowerCase
}

// Test the functions (these will all crash)
const testUser: User = { id: 1, name: "Test" };
const testResponse: ApiResponse = {};

// Uncomment to see crashes:
// console.log(getUserTheme(testUser));
// console.log(processUsers(testResponse));
// console.log(getFirstUser([]));
