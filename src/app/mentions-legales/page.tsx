import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mentions légales" };
export default function LegalPage() {
  return <section className="container page legal-page"><h1>Mentions légales</h1><p>Les informations légales de l’entreprise et de l’hébergement sont en cours de validation. Aucune commande réelle n’est ouverte sur ce site.</p><h2>À propos de la démonstration</h2><p>Les exemples de menus et de photographies sont fictifs. L’adresse du 36 rue de la Benauge, 33100 Bordeaux, est une implantation fictive retenue pour le projet ; elle ne désigne pas un établissement Vite & Gourmand réel.</p></section>;
}
