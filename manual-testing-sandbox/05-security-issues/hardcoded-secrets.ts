// SECURITY FILE: Hardcoded secrets and credentials
// NOTE: These are OBVIOUSLY FAKE values for demonstration purposes only!

// VULNERABILITY 1: Hardcoded API keys
const API_KEY = "FAKE_API_KEY_DO_NOT_USE_IN_PRODUCTION";
const STRIPE_SECRET_KEY = "FAKE_stripe_key_for_testing_only";
const AWS_ACCESS_KEY = "FAKE_AWS_ACCESS_KEY_EXAMPLE";
const AWS_SECRET_KEY = "FAKE_AWS_SECRET_KEY_EXAMPLE_DO_NOT_USE";

// VULNERABILITY 2: Hardcoded database credentials
const DATABASE_CONFIG = {
  host: "production-db.example.com",
  port: 5432,
  database: "production_db",
  username: "admin",
  password: "FAKE_SuperSecretP@ssw0rd123!", // Hardcoded password!
};

// VULNERABILITY 3: Hardcoded JWT secret
const JWT_SECRET = "FAKE_jwt_secret_that_should_be_in_env_vars";

// VULNERABILITY 4: Hardcoded OAuth credentials
const OAUTH_CONFIG = {
  google: {
    clientId: "FAKE_google_client_id.apps.googleusercontent.com",
    clientSecret: "FAKE_google_client_secret",
  },
  github: {
    clientId: "FAKE_github_client_id",
    clientSecret: "FAKE_github_client_secret_do_not_use",
  },
};

// VULNERABILITY 5: Hardcoded encryption key
const ENCRYPTION_KEY = "FAKE_32_byte_encryption_key_xxx";
const ENCRYPTION_IV = "FAKE_16_byte_iv!";

// VULNERABILITY 6: Hardcoded email credentials
const EMAIL_CONFIG = {
  smtp: {
    host: "smtp.example.com",
    port: 587,
    user: "fake-email@example.com",
    password: "FAKE_app_specific_password",
  },
};

// VULNERABILITY 7: Hardcoded third-party service credentials
const SERVICES = {
  twilio: {
    accountSid: "FAKE_twilio_account_sid_for_testing",
    authToken: "FAKE_twilio_auth_token_do_not_use",
  },
  sendgrid: {
    apiKey: "FAKE_sendgrid_api_key_for_testing_only",
  },
  slack: {
    webhookUrl: "https://example.com/fake-webhook-url-for-testing",
    botToken: "FAKE_slack_bot_token_do_not_use",
  },
};

// VULNERABILITY 8: Hardcoded private key
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGy0AHB7MvMqGHJLPi...
(truncated for brevity but imagine full private key here)
-----END RSA PRIVATE KEY-----`;

// VULNERABILITY 9: Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

// VULNERABILITY 10: Hardcoded connection strings
const CONNECTION_STRINGS = {
  mongodb:
    "mongodb://admin:password123@production-mongo.example.com:27017/mydb",
  redis: "redis://:secretpassword@production-redis.example.com:6379",
  postgres:
    "postgresql://user:password@production-pg.example.com:5432/database",
};

// VULNERABILITY 11: Credentials in URLs
async function fetchData() {
  const response = await fetch(
    "https://api.example.com/data?api_key=secret123&token=abc456",
  );
  return response.json();
}

// VULNERABILITY 12: Hardcoded webhook secrets
const WEBHOOK_SECRETS = {
  stripe: "whsec_1234567890abcdef1234567890abcdef",
  github: "sha256=1234567890abcdef1234567890abcdef1234567890abcdef",
};

// Usage of these credentials (makes them even easier to find)
export class ApiService {
  private apiKey = API_KEY;

  async makeRequest(endpoint: string) {
    return fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "X-API-Key": STRIPE_SECRET_KEY,
      },
    });
  }
}

export class DatabaseService {
  connect() {
    // Using hardcoded credentials
    return {
      host: DATABASE_CONFIG.host,
      user: DATABASE_CONFIG.username,
      password: DATABASE_CONFIG.password,
    };
  }
}

export class AuthService {
  signToken(payload: object) {
    // Using hardcoded JWT secret
    return `signed_with_${JWT_SECRET}`;
  }
}

export {
  ADMIN_CREDENTIALS,
  API_KEY,
  DATABASE_CONFIG,
  JWT_SECRET,
  OAUTH_CONFIG,
  SERVICES,
};
