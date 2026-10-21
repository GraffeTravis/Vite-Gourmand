import type { Metadata } from "next";
export const metadata: Metadata = { title: "Tous les menus" };
export default function MenusPage() {
  return <section className="container page"><p className="eyebrow">À PARTAGER</p><h1>Tous les menus</h1><div className="notice"><h2>Notre catalogue arrive bientôt</h2><p>Les menus seront affichés ici après intégration et validation du catalogue. Aucune commande n’est ouverte pour le moment.</p></div></section>;
}
