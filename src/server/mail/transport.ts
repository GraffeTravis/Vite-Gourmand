import "server-only";
import nodemailer from "nodemailer";
import { getServerEnvironment } from "../config";
import { requireSmtpConfiguration } from "../config/environment";

// Le transport seul n'assure pas une livraison durable : prévoir l'outbox avant les envois métier.
export function createMailTransport() {
  const { SMTP_HOST: host, SMTP_PORT: port, SMTP_USER: user, SMTP_PASSWORD: pass } = requireSmtpConfiguration(getServerEnvironment());
  return nodemailer.createTransport({ host, port, secure: port === 465,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: 5000,
  });
}
