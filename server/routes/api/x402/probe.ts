import { defineEventHandler, getQuery, setResponseStatus } from "h3";
import { probeAllowed } from "../../../../src/lib/live/probe.server.ts";

export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    setResponseStatus(event, 405);
    return { error: "Use GET. This route never pays." };
  }
  const url = String(getQuery(event).url || "");
  try {
    return await probeAllowed(url);
  } catch (error) {
    setResponseStatus(event, 400);
    return { error: error instanceof Error ? error.message : "Could not read that resource." };
  }
});
