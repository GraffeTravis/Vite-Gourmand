import type { Metadata } from "next";
import Link from "next/link";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <header className="container header"><Link className="brand" href="/">Vite & Gourmand<span>TRAITEUR À BORDEAUX</span></Link>
      <nav aria-label="Navigation principale"><Link href="/">Accueil</Link><Link href="/menus">Tous les menus</Link></nav>
    </header>
    <main id="contenu" tabIndex={-1}>{children}</main>
    <footer><div className="container"><p className="footer-brand">Vite & Gourmand</p><p>Julie et José · Bordeaux</p><p>Horaires et informations légales : contenus à valider avant ouverture.</p></div></footer>
  </body></html>;
}
