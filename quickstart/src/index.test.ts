/**
 * Quickstart Example Tests
 *
 * These tests verify the example code works correctly.
 * Run with: npm test
 *
 * For full integration tests (against real API):
 *   ATTROVE_CLIENT_ID=... ATTROVE_CLIENT_SECRET=... npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  Attrove,
  type ApiKeyFormat,
  AttroveError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  isAttroveError,
  isAuthenticationError,
  isValidationError,
} from "@attrove/sdk";

describe("SDK Import", () => {
  it("should import Attrove client", () => {
    expect(Attrove).toBeDefined();
    expect(typeof Attrove).toBe("function");
  });

  it("should have admin factory method", () => {
    expect(Attrove.admin).toBeDefined();
    expect(typeof Attrove.admin).toBe("function");
  });

  it("should export error classes for typed error handling", () => {
    expect(AttroveError).toBeDefined();
    expect(AuthenticationError).toBeDefined();
    expect(ValidationError).toBeDefined();
    expect(RateLimitError).toBeDefined();
  });

  it("should export type guard functions", () => {
    expect(typeof isAttroveError).toBe("function");
    expect(typeof isAuthenticationError).toBe("function");
    expect(typeof isValidationError).toBe("function");
  });
});

describe("Client Instantiation", () => {
  it("should create client with valid config", () => {
    const client = new Attrove({
      apiKey: "sk_test_fake_key",
      userId: "00000000-0000-0000-0000-000000000000",
    });
    expect(client).toBeDefined();
    expect(client.query).toBeDefined();
    expect(client.search).toBeDefined();
    expect(client.integrations).toBeDefined();
  });

  it("should have all expected methods on client", () => {
    const client = new Attrove({
      apiKey: "sk_test_fake_key",
      userId: "00000000-0000-0000-0000-000000000000",
    });
    expect(typeof client.query).toBe("function");
    expect(typeof client.search).toBe("function");
    expect(client.integrations).toBeDefined();
    expect(typeof client.integrations.list).toBe("function");
  });

  it("should create admin client with credentials", () => {
    const admin = Attrove.admin({
      clientId: "test_client_id",
      clientSecret: "test_client_secret",
    });
    expect(admin).toBeDefined();
    expect(admin.users).toBeDefined();
  });
});

describe("Input Validation", () => {
  it("should throw ValidationError for empty clientId", () => {
    expect(() => {
      Attrove.admin({ clientId: "", clientSecret: "test_secret" });
    }).toThrow();
  });

  it("should throw ValidationError for empty clientSecret", () => {
    expect(() => {
      Attrove.admin({ clientId: "test_id", clientSecret: "" });
    }).toThrow();
  });
});

describe("Error Type Guards", () => {
  it("should correctly identify AttroveError instances", () => {
    const error = new AttroveError("Test error", "INTERNAL_ERROR");
    expect(isAttroveError(error)).toBe(true);
    expect(isAttroveError(new Error("Regular error"))).toBe(false);
    expect(isAttroveError("string")).toBe(false);
  });

  it("should correctly identify AuthenticationError instances", () => {
    const error = new AuthenticationError("Auth failed");
    expect(isAuthenticationError(error)).toBe(true);
    expect(isAttroveError(error)).toBe(true);
    expect(isAuthenticationError(new Error("Regular error"))).toBe(false);
  });

  it("RateLimitError should have retryAfter property", () => {
    const error = new RateLimitError("Rate limited", 60);
    expect(error.retryAfter).toBe(60);
    expect(error.status).toBe(429);
  });

  it("RateLimitError should handle undefined retryAfter", () => {
    const error = new RateLimitError("Rate limited");
    expect(error.retryAfter).toBeUndefined();
  });
});

// Integration tests - only run with real credentials
// Note: Test users accumulate in the database. Manual cleanup may be required periodically.
describe.skipIf(
  !process.env.ATTROVE_CLIENT_ID || !process.env.ATTROVE_CLIENT_SECRET,
)("Integration Tests", () => {
  let admin: ReturnType<typeof Attrove.admin>;
  let testUserId: string;
  let testApiKey: string;

  beforeAll(() => {
    admin = Attrove.admin({
      clientId: process.env.ATTROVE_CLIENT_ID!,
      clientSecret: process.env.ATTROVE_CLIENT_SECRET!,
    });
  });

  afterAll(() => {
    // Log test user info for manual cleanup if needed
    if (testUserId) {
      console.log(
        `Test user created: ${testUserId} (manual cleanup may be needed)`,
      );
    }
  });

  it("should provision a test user", async () => {
    const testEmail = `quickstart-test-${Date.now()}@example.com`;
    const result = await admin.users.create({ email: testEmail });

    expect(result.id, "User ID should be defined").toBeDefined();
    expect(result.apiKey, "API key should be defined").toBeDefined();
    expect(
      result.apiKey.startsWith("sk_"),
      "API key should start with sk_",
    ).toBe(true);

    testUserId = result.id;
    testApiKey = result.apiKey;
  });

  it("should generate connect token with correct format", async () => {
    const result = await admin.users.createConnectToken(testUserId);

    expect(result.token, "Connect token should be defined").toBeDefined();
    expect(
      result.token.startsWith("pit_"),
      "Connect token should start with pit_",
    ).toBe(true);
    expect(result.expires_at, "Expiration should be defined").toBeDefined();

    // Verify expiration is in the future (tokens are valid for ~10 minutes)
    const expiresAt = new Date(result.expires_at).getTime();
    expect(expiresAt).toBeGreaterThan(Date.now());
  });

  it("should list integrations (empty for new user)", async () => {
    const client = new Attrove({
      apiKey: testApiKey as ApiKeyFormat,
      userId: testUserId,
    });

    const integrations = await client.integrations.list();
    expect(Array.isArray(integrations), "Integrations should be an array").toBe(
      true,
    );
    // New user should have no integrations
    expect(integrations.length).toBe(0);
  });
});
