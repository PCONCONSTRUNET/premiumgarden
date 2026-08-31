import { defineConfig } from "@lovable.dev/vite-tanstack-config";

import fs from "fs";
import path from "path";

function copyTslibIntoVercelFunction() {
  const vercelFunctionDir = path.resolve(".vercel/output/functions/__server.func");
  if (!fs.existsSync(vercelFunctionDir)) {
    return;
  }
  const src = path.resolve("node_modules/tslib");
  const dest = path.join(vercelFunctionDir, "node_modules/tslib");
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  fs.cpSync(src, dest, { recursive: true });
}

export default defineConfig({
  vite: {
    plugins: [
      {
        name: "copy-tslib-into-vercel-function",
        closeBundle: copyTslibIntoVercelFunction,
      },
    ],
    ssr: {
      noExternal: [/^@radix-ui/],
      external: [
        "pg",
        "tslib",
        "@supabase/supabase-js",
        "@supabase/auth-js",
        "@supabase/postgrest-js",
        "@supabase/realtime-js",
        "@supabase/storage-js",
        "@supabase/functions-js",
        "@supabase/phoenix",
        "iceberg-js",
      ],
    },
  },
  nitro: {
    preset: "vercel",
    traceDeps: ["tslib", "@supabase/supabase-js"],
  } as any,
});
