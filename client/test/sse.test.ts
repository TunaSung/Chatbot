import assert from "node:assert/strict";
import test from "node:test";
import { readEventStream } from "../src/services/sse.ts";

test("parses ordered SSE events across arbitrary chunk boundaries", async () => {
  const encoder = new TextEncoder();
  const payload = [
    ": connected\n\n",
    'event: ready\ndata: {"conversationId":1}\n\n',
    'event: delta\ndata: {"content":"你"}\n\n',
    'event: delta\ndata: {"content":"好"}\n\n',
    "event: done\ndata: {}\n\n",
  ].join("");
  const splitPoints = [7, 25, 61, 88, payload.length];
  let offset = 0;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const end of splitPoints) {
        controller.enqueue(encoder.encode(payload.slice(offset, end)));
        offset = end;
      }
      controller.close();
    },
  });

  const events: Array<{ event: string; data: unknown }> = [];
  await readEventStream(stream, (event) => events.push(event));

  assert.deepEqual(
    events.map((event) => event.event),
    ["ready", "delta", "delta", "done"]
  );
  assert.equal(
    events
      .filter((event) => event.event === "delta")
      .map((event) => (event.data as { content: string }).content)
      .join(""),
    "你好"
  );
});
