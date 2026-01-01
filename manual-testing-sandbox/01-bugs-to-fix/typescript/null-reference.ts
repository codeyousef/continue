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

function getUserTheme(user: User): string {
  return user.profile.preferences.theme;
}

function processUsers(response: ApiResponse): string[] {
  return response.data.map((u) => u.name);
}

function getFirstUser(users: User[]): User {
  return users[0];
}

function getUserById(users: User[], id: number): string {
  const user = users.find((u) => u.id === id);
  return user.name;
}

function displayUser(user: User) {
  const {
    profile: { email, avatar },
  } = user;
  console.log(`${email} - ${avatar}`);
}

function getAvatarUrl(user: User): string {
  return user.profile.avatar.toUpperCase();
}

function getSecondPreference(prefs: string[]): string {
  return prefs[1].toLowerCase();
}

const testUser: User = { id: 1, name: "Test" };
const testResponse: ApiResponse = {};
