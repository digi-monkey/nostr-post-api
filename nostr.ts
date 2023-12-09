import {
  NostrEvent,
} from "https://raw.githubusercontent.com/BlowaterNostr/nostr.ts/4671ee04a8abe16dc6fcedf76d74508863b4b79f/nostr.ts";
import { ConnectionPool } from "https://raw.githubusercontent.com/BlowaterNostr/nostr.ts/4671ee04a8abe16dc6fcedf76d74508863b4b79f/relay.ts";

const pool = new ConnectionPool();
/* optional await */ pool.addRelayURLs([
  "wss://nos.lol",
  "wss://relay.nostr.band",
]);

export async function getPost(pubkey: string, identifire: string) {
  const subId = pubkey.slice(0, 4) + ":" + identifire;
  const subscription = await pool.newSub(subId, {
    kinds: [30023],
    limit: 1,
    authors: [pubkey],
    "#d": [identifire],
  });
  if (subscription instanceof Error) {
    // handle the error
    console.log(subscription);
    return null;
  }
  const { chan } = subscription;
  let event: NostrEvent | null = null;

  for await (const { res: msg, url } of chan) {
    if (msg.type === "EVENT") {
      if (!event) {
        event = msg.event;
      } else {
        if (msg.event.created_at > event.created_at) {
          event = msg.event;
        }
      }
    }

    if (msg.type === "EOSE") {
      pool.closeSub(subId);
    }
  }

  return event;
}
