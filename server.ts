import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { getPost } from "./nostr.ts";

import LRU from "https://deno.land/x/lru@1.0.2/mod.ts";

const lru = new LRU<string>(100);

const app = new Application();
const router = new Router();

router.get("/", async (ctx) => {
  const requestUrl = new URL(ctx.request.url);
  const pubkey = requestUrl.searchParams.get("pubkey");
  const id = requestUrl.searchParams.get("id");
  if (!pubkey || !id) {
    ctx.response.body = "{}";
    return;
  }

  const url = pubkey + ":" + id;

  const cache = lru.get(url);
  if (cache) {
    console.log("return cache");
    ctx.response.body = JSON.parse(cache);
  } else {
    const post = await getPost(pubkey, id);
    const json = JSON.stringify(post);
    lru.set(url, json);
    ctx.response.body = json;
  }
});

app.use(oakCors()); // Add CORS middleware
app.use(router.routes());
app.use(router.allowedMethods());

const port = 8000;
console.log(`Listening on http://localhost:${port}`);
await app.listen({ port });
