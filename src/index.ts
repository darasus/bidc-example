import { serve } from "bun";
import index from "./index.html";
import dialog from "./dialog.html";
import iframe from "./iframe.html";

const server = serve({
  routes: {
    "/": index,
    "/dialog": dialog,
    "/iframe": iframe,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
