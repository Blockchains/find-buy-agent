import { defineEventHandler, setResponseStatus } from "h3";
import { discoverBase } from "../../../../src/lib/live/probe.server.ts";

export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    setResponseStatus(event, 405);
    return { error: "Use GET." };
  }
  try {
    return { items: await discoverBase() };
  } catch (error) {
    setResponseStatus(event, 502);
    return { error: error instanceof Error ? error.message : "The Bazaar did not answer.", items: [] };
  }
});
