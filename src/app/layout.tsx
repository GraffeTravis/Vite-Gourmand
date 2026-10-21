import type { Metadata } from "next";
import Link from "next/link";
import { getServerEnvironment } from "@/server/config";
import { getPostgres } from "@/server/db/postgres";
import { readBusinessHours } from "@/modules/public/server/content";
import { publicHours } from "@/modules/public/domain/hours";
import "@fontsource/fraunces/400.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vite & Gourmand · Traiteur à Bordeaux", template: "%s | Vite & Gourmand" },
  description: "Les menus événementiels de Julie et José, traiteurs à Bordeaux.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demo = getServerEnvironment().APP_ENV !== "production";
  let hours = publicHours([]);
  try { hours = publicHours(await readBusinessHours(getPostgres())); } catch { /* Aucune heure inventée en cas de panne. */ }
  return <html lang="fr"><body>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    {demo && <div className="site-notice">Démonstration · Menus et photographies fictifs · Aucune commande réelle</div>}
    <header className="container header"><Link className="brand" href="/">Vite & Gourmand<span>TRAITEUR À BORDEAUX</span></Link>
      <nav aria-label="Navigation principale"><Link href="/">Accueil</Link><Link href="/menus">Tous les menus</Link></nav>
    </header>
    <main id="contenu" tabIndex={-1}>{children}</main>
    <footer><div className="container footer-grid"><div><p className="footer-brand">À bientôt à table.</p><p>Une cuisine généreuse, des moments à partager.</p><p>Julie et José · Bordeaux</p></div><section aria-labelledby="hours-title"><h2 id="hours-title">Du lundi au dimanche</h2><dl className="business-hours">{hours.map(({ day, text }) => <div key={day}><dt>{day}</dt><dd>{text}</dd></div>)}</dl></section><nav aria-label="Informations légales"><Link href="/mentions-legales">Mentions légales</Link><Link href="/cgv">Conditions générales de vente</Link></nav></div></footer>
  </body></html>;
}
