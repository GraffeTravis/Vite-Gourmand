import type { NextConfig } from "next";
import { readServerEnvironment } from "./src/server/config/environment";

// Une configuration distante invalide doit aussi arrêter la construction du déploiement.
if (process.env.VERCEL || ["preview", "production"].includes(process.env.APP_ENV ?? "")) {
  readServerEnvironment(process.env);
}

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default config;
