import { describe, expect, it } from "vitest";
import { readServerEnvironment, requireSmtpConfiguration } from "./environment";

const local = {
  APP_ENV: "development", APP_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://vg:secret@localhost:5433/vite_gourmand",
  MONGODB_URI: "mongodb://localhost:27017", MONGODB_DATABASE: "analytics",
  SMTP_HOST: "localhost", SMTP_PORT: "1025", SMTP_FROM: "Vite & Gourmand <bonjour@vite-gourmand.test>",
};
const remote = { ...local, APP_ENV: "preview", APP_URL: "https://preview.example.com", DATABASE_URL: "postgresql://vg:secret@sql.example.com/vg", MONGODB_URI: "mongodb+srv://vg:secret@mongo.example.com", SMTP_HOST: "smtp.example.com", SMTP_FROM: "Traiteur <bonjour@example.com>" };

describe("configuration serveur", () => {
  it("accepte la configuration locale explicite", () => {
    expect(readServerEnvironment(local).SMTP_PORT).toBe(1025);
  });
  it.each(["DATABASE_URL", "APP_URL", "SMTP_FROM", "MONGODB_DATABASE"])("refuse l'absence de %s", (key) => {
    expect(() => readServerEnvironment({ ...local, [key]: undefined })).toThrow(key);
  });
  it("ne révèle jamais la valeur du secret dans une erreur", () => {
    expect(() => readServerEnvironment({ ...local, DATABASE_URL: "super-secret" })).toThrow("Configuration serveur invalide : DATABASE_URL");
  });
  it("accepte un environnement distant complet", () => {
    expect(readServerEnvironment(remote).APP_ENV).toBe("preview");
  });
  it.each([
    { APP_URL: "http://preview.example.com" }, { APP_URL: "https://localhost:3000" },
    { DATABASE_URL: local.DATABASE_URL }, { MONGODB_URI: local.MONGODB_URI },
    { SMTP_HOST: "mailpit" }, { SMTP_FROM: local.SMTP_FROM },
  ])("refuse une configuration distante pointant sur des services locaux", (override) => {
    expect(() => readServerEnvironment({ ...remote, ...override })).toThrow();
  });
  it("refuse le mode local sur Vercel", () => {
    expect(() => readServerEnvironment({ ...local, VERCEL: "1" })).toThrow("APP_ENV distant requis");
  });
  it.each(["0", "65536", "12.5", "invalid"])("refuse le port %s", (SMTP_PORT) => {
    expect(() => readServerEnvironment({ ...local, SMTP_PORT })).toThrow("SMTP_PORT");
  });
  it("refuse des identifiants SMTP incomplets", () => {
    expect(() => readServerEnvironment({ ...local, SMTP_USER: "test" })).toThrow("SMTP_USER, SMTP_PASSWORD");
  });
  it("refuse une URL contenant un chemin pour les liens des e-mails", () => {
    expect(() => readServerEnvironment({ ...local, APP_URL: "http://localhost:3000/connexion" })).toThrow("APP_URL");
  });
  const mailDisabled = { ...remote, MAIL_TRANSPORT: "disabled", SMTP_HOST: undefined, SMTP_PORT: undefined, SMTP_FROM: undefined };
  it("accepte explicitement un catalogue distant sans service d'envoi", () => {
    expect(readServerEnvironment(mailDisabled).MAIL_TRANSPORT).toBe("disabled");
  });
  it("refuse toute tentative d'envoi lorsque le transport est désactivé", () => {
    expect(() => requireSmtpConfiguration(readServerEnvironment(mailDisabled))).toThrow("Envoi d'e-mails désactivé");
  });
  it("exige toujours SMTP si le mode n'est pas explicitement désactivé", () => {
    expect(() => readServerEnvironment({ ...mailDisabled, MAIL_TRANSPORT: undefined })).toThrow("SMTP_HOST");
  });
  it.each([{ DATABASE_URL: local.DATABASE_URL }, { APP_URL: "http://preview.example.com" }])("conserve les protections distantes sans e-mails", (override) => {
    expect(() => readServerEnvironment({ ...mailDisabled, ...override })).toThrow("Configuration distante invalide");
  });
  it("refuse un mode d'envoi inconnu", () => {
    expect(() => readServerEnvironment({ ...remote, MAIL_TRANSPORT: "fake" })).toThrow("MAIL_TRANSPORT");
  });
});
