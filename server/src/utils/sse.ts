import type { ServerResponse } from "node:http";
import { once } from "node:events";

export function encodeSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function writeSseEvent(
  response: ServerResponse,
  event: string,
  data: unknown
): Promise<void> {
  if (response.writableEnded || response.destroyed) return;
  if (!response.write(encodeSseEvent(event, data))) {
    await Promise.race([once(response, "drain"), once(response, "close")]);
  }
}
