import { createServerFn } from "@tanstack/react-start";
import type { MarketPage, SourceId } from "./catalog";

type ListInput = { source?: SourceId | "all"; offset?: number; limit?: number; query?: string };

export const listMarket = createServerFn({ method: "POST" })
  .inputValidator((input: ListInput) => input)
  .handler(async ({ data }): Promise<MarketPage> => {
    const { loadMarket } = await import("./catalog.server");
    return loadMarket(data);
  });

export const probeOffer = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data }) => {
    const { probeResource } = await import("./catalog.server");
    return probeResource(data.url);
  });

export const relayPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string; paymentSignature: string }) => input)
  .handler(async ({ data }) => {
    const { relaySignedGet } = await import("./catalog.server");
    return relaySignedGet(data.url, data.paymentSignature);
  });

export const readBalances = createServerFn({ method: "POST" })
  .inputValidator((input: { address: string }) => input)
  .handler(async ({ data }) => {
    const { readOnchainBalances } = await import("./catalog.server");
    return readOnchainBalances(data.address);
  });
