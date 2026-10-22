import { z } from "zod";

const environmentSchema = z.object({
  APP_ENV: z.enum(["development", "test", "preview", "production"]),
  APP_URL: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\/\S+$/),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\/\S+$/),
  MONGODB_DATABASE: z.string().min(1).max(63).regex(/^[a-zA-Z0-9_-]+$/),
  MAIL_TRANSPORT: z.enum(["smtp", "disabled"]).default("smtp"),
  READINESS_SECRET: z.string().min(32).max(256).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

const smtpSchema = z.object({
  SMTP_HOST: z.string().min(1).regex(/^[^\s/]+$/),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_FROM: z.string().min(3).regex(/^[^\r\n]+@[^\r\n]+$/),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
});

type BaseEnvironment = z.infer<typeof environmentSchema>;
type SmtpConfiguration = z.infer<typeof smtpSchema>;
export type ServerEnvironment = BaseEnvironment & (
  | ({ MAIL_TRANSPORT: "smtp" } & SmtpConfiguration)
  | ({ MAIL_TRANSPORT: "disabled" } & Partial<Record<keyof SmtpConfiguration, never>>)
);

export function requireSmtpConfiguration(config: ServerEnvironment): SmtpConfiguration {
  if (config.MAIL_TRANSPORT === "disabled") throw new Error("Envoi d'e-mails désactivé : configurer MAIL_TRANSPORT=smtp et le fournisseur SMTP");
  return config;
}

// Fonction pure pour les tests ; les points d'accès qui la consomment sont server-only.
export function readServerEnvironment(source: Record<string, string | undefined>): ServerEnvironment {
  const appEnvironment = source.APP_ENV ?? source.VERCEL_ENV ?? (source.NODE_ENV === "production" ? "production" : "development");
  const result = environmentSchema.safeParse({ ...source, APP_ENV: appEnvironment });
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))].join(", ");
    // Ne jamais inclure les valeurs ni le détail Zod : les URL contiennent des secrets.
    throw new Error(`Configuration serveur invalide : ${fields}`);
  }
  const base = result.data;
  let config: ServerEnvironment;
  if (base.MAIL_TRANSPORT === "smtp") {
    const smtp = smtpSchema.safeParse(source);
    if (!smtp.success) {
      const fields = [...new Set(smtp.error.issues.map((issue) => issue.path[0]))].join(", ");
      throw new Error(`Configuration serveur invalide : ${fields}`);
    }
    if (Boolean(smtp.data.SMTP_USER) !== Boolean(smtp.data.SMTP_PASSWORD)) {
      throw new Error("Configuration serveur invalide : SMTP_USER, SMTP_PASSWORD");
    }
    config = { ...base, ...smtp.data, MAIL_TRANSPORT: "smtp" };
  } else {
    config = { ...base, MAIL_TRANSPORT: "disabled" };
  }
  const remote = config.APP_ENV === "preview" || config.APP_ENV === "production";
  if (source.VERCEL && !remote) throw new Error("Configuration serveur invalide : APP_ENV distant requis");
  const appUrl = new URL(config.APP_URL);
  if (appUrl.username || appUrl.password || appUrl.pathname !== "/" || appUrl.search || appUrl.hash || !["http:", "https:"].includes(appUrl.protocol)) {
    throw new Error("Configuration serveur invalide : APP_URL doit être une origine HTTP(S)");
  }
  if (remote) {
    const urls = [config.APP_URL, config.DATABASE_URL, config.MONGODB_URI];
    if (appUrl.protocol !== "https:" || urls.some((value) => /(?:\/\/|@)(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)(?=[:/]|$)/i.test(value)) || (config.MAIL_TRANSPORT === "smtp" && /^(localhost|127\.|mailpit$)/i.test(config.SMTP_HOST))) {
      throw new Error("Configuration distante invalide : HTTPS et services distants requis");
    }
    if (config.MAIL_TRANSPORT === "smtp" && (config.SMTP_FROM.includes(".test") || config.SMTP_FROM.includes(".invalid"))) {
      throw new Error("Configuration distante invalide : SMTP_FROM doit être validé pour l'envoi");
    }
  }
  return config;
}
