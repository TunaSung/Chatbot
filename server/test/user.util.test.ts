import assert from "node:assert/strict";
import test from "node:test";
import { omitPrivateUserFields } from "../src/services/utils/user.util.ts";

test("removes password and refresh token hash from serialized users", () => {
  assert.deepEqual(
    omitPrivateUserFields({
      id: 1,
      email: "user@example.com",
      password: "password-hash",
      refreshTokenHash: "refresh-token-hash",
    }),
    {
      id: 1,
      email: "user@example.com",
    }
  );
});
