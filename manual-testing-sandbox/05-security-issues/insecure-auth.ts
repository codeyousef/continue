// SECURITY FILE: Insecure authentication patterns

import * as crypto from "crypto";

interface User {
  id: string;
  username: string;
  password: string;
  role: string;
}

// Simulated user database
const users: User[] = [];

// VULNERABILITY 1: Storing passwords in plain text
class InsecureUserService {
  createUser(username: string, password: string): User {
    const user: User = {
      id: `user_${Date.now()}`,
      username,
      // VULNERABLE: Plain text password storage
      password: password,
      role: "user",
    };
    users.push(user);
    return user;
  }

  // VULNERABILITY 2: Timing attack vulnerable comparison
  authenticate(username: string, password: string): User | null {
    const user = users.find((u) => u.username === username);
    if (!user) return null;

    // VULNERABLE: String comparison is not constant-time
    if (user.password === password) {
      return user;
    }
    return null;
  }
}

// VULNERABILITY 3: Weak password hashing (MD5)
class WeakHashingService {
  hashPassword(password: string): string {
    // VULNERABLE: MD5 is cryptographically broken
    return crypto.createHash("md5").update(password).digest("hex");
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}

// VULNERABILITY 4: No salt in password hashing
class UnsaltedHashService {
  hashPassword(password: string): string {
    // VULNERABLE: No salt - rainbow table attacks possible
    return crypto.createHash("sha256").update(password).digest("hex");
  }
}

// VULNERABILITY 5: Predictable session tokens
class PredictableSessionService {
  private sessionCounter = 0;

  createSession(userId: string): string {
    // VULNERABLE: Sequential, predictable session IDs
    this.sessionCounter++;
    return `session_${userId}_${this.sessionCounter}`;
  }
}

// VULNERABILITY 6: Weak random token generation
class WeakTokenService {
  generateToken(): string {
    // VULNERABLE: Math.random() is not cryptographically secure
    return Math.random().toString(36).substring(2);
  }

  generateResetToken(): string {
    // VULNERABLE: Timestamp-based token is predictable
    return Date.now().toString(36);
  }
}

// VULNERABILITY 7: No rate limiting on login
class NoRateLimitAuth {
  private failedAttempts: Map<string, number> = new Map();

  async login(username: string, password: string): Promise<boolean> {
    // VULNERABLE: No rate limiting, brute force possible
    const user = users.find((u) => u.username === username);
    if (!user) return false;
    return user.password === password;
  }
}

// VULNERABILITY 8: Insecure "remember me" token
class InsecureRememberMe {
  createRememberToken(userId: string): string {
    // VULNERABLE: Token contains user ID, no expiration
    return Buffer.from(userId).toString("base64");
  }

  getUserFromToken(token: string): string {
    return Buffer.from(token, "base64").toString("utf8");
  }
}

// VULNERABILITY 9: JWT without expiration
class InsecureJWT {
  private secret = "hardcoded-secret"; // Also vulnerable!

  createToken(payload: object): string {
    // VULNERABLE: No expiration, weak secret
    const header = Buffer.from(
      JSON.stringify({ alg: "HS256", typ: "JWT" }),
    ).toString("base64");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64");
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(`${header}.${body}`)
      .digest("base64");
    return `${header}.${body}.${signature}`;
  }
}

// VULNERABILITY 10: No password complexity requirements
class NoPasswordPolicy {
  isValidPassword(password: string): boolean {
    // VULNERABLE: Only checks length, allows weak passwords
    return password.length >= 4;
  }
}

// VULNERABILITY 11: Password in URL/logs
class PasswordInUrl {
  async login(request: { query: { username: string; password: string } }) {
    // VULNERABLE: Password in query string (visible in logs, browser history)
    const { username, password } = request.query;
    console.log(`Login attempt: ${username}:${password}`); // Also logging password!
    return this.authenticate(username, password);
  }

  private authenticate(username: string, password: string): boolean {
    return true;
  }
}

// VULNERABILITY 12: Broken password reset
class InsecurePasswordReset {
  private resetTokens: Map<string, string> = new Map();

  requestReset(email: string): string {
    // VULNERABLE: Token is just the email encoded
    const token = Buffer.from(email).toString("base64");
    this.resetTokens.set(token, email);
    return token;
  }

  resetPassword(token: string, newPassword: string): boolean {
    // VULNERABLE: No token expiration, no single-use enforcement
    const email = this.resetTokens.get(token);
    if (!email) return false;
    // Password would be updated here...
    // Token is NOT invalidated after use!
    return true;
  }
}

// VULNERABILITY 13: Information leakage in error messages
class LeakyErrorMessages {
  authenticate(
    username: string,
    password: string,
  ): { success: boolean; error?: string } {
    const user = users.find((u) => u.username === username);

    if (!user) {
      // VULNERABLE: Reveals that username doesn't exist
      return { success: false, error: "User not found" };
    }

    if (user.password !== password) {
      // VULNERABLE: Reveals that password is wrong (username exists)
      return { success: false, error: "Incorrect password" };
    }

    return { success: true };
  }
}

export {
  InsecureJWT,
  InsecurePasswordReset,
  InsecureRememberMe,
  InsecureUserService,
  LeakyErrorMessages,
  NoPasswordPolicy,
  NoRateLimitAuth,
  PasswordInUrl,
  PredictableSessionService,
  UnsaltedHashService,
  WeakHashingService,
  WeakTokenService,
};
