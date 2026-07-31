export type ServerSentEvent = {
  event: string;
  data: unknown;
};

function parseFrame(frame: string): ServerSentEvent | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (!line || line.startsWith(":")) continue;
    if (line.startsWith("event:")) {
      event = line.slice(6).trimStart();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) return null;
  return {
    event,
    data: JSON.parse(dataLines.join("\n")),
  };
}

export async function readEventStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: ServerSentEvent) => void
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done }).replace(/\r/g, "");

      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const event = parseFrame(frame);
        if (event) onEvent(event);
        boundary = buffer.indexOf("\n\n");
      }

      if (done) break;
    }

    const trailingEvent = parseFrame(buffer.trim());
    if (trailingEvent) onEvent(trailingEvent);
  } finally {
    reader.releaseLock();
  }
}
