import { describe, expect, it } from "vitest";

import { usernameToEmail } from "./authLogic";

describe("usernameToEmail", () => {
  it("normalizes a username into the internal auth email format", () => {
    expect(usernameToEmail("  TestUser  ")).toBe("testuser@example.com");
  });
});
