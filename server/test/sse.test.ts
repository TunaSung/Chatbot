import assert from "node:assert/strict";
import test from "node:test";
import { encodeSseEvent } from "../src/utils/sse.ts";

test("encodes one complete SSE frame", () => {
  assert.equal(
    encodeSseEvent("delta", { content: "第一行\n第二行" }),
    'event: delta\ndata: {"content":"第一行\\n第二行"}\n\n'
  );
});
