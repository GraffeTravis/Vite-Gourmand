import Link from "next/link";
import Image from "next/image";
import { getPostgres } from "@/server/db/postgres";
import { getServerEnvironment } from "@/server/config";
import { readCatalog } from "@/modules/menus/server/catalogue";
import { readApprovedReviews } from "@/modules/public/server/content";
import type { MenuSummary } from "@/modules/menus/domain/catalogue";
import { MenuCard } from "@/modules/menus/components/MenuCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const includeDemo = getServerEnvironment().APP_ENV !== "production";
  let menus: MenuSummary[] = [];
  let reviews: Awaited<ReturnType<typeof readApprovedReviews>> = [];
  let unavailable = false;
  try {
    const [catalog, approved] = await Promise.all([readCatalog(getPostgres(), { page: 1 }, includeDemo), readApprovedReviews(getPostgres(), includeDemo)]);
    menus = catalog.menus.slice(0, 3); reviews = approved;
  } catch { unavailable = true; }

  return <div className="container">
    <section className="hero" aria-labelledby="titre-accueil"><div>
      <p className="eyebrow">LE GOÛT DU PARTAGE, DEPUIS 25 ANS</p>
      <h1 id="titre-accueil">De bons moments,<br />autour d’une belle table.</h1>
      <p>À Bordeaux, Julie et José vous accompagnent avec des menus pour vos repas du quotidien, vos fêtes de saison et vos événements privés.</p>
      <Link className="button" href="/menus">Découvrir les menus <span aria-hidden="true">↗</span></Link>
    </div>{includeDemo ? <figure className="hero-picture"><Image src="/images/demo/convivial.jpg" alt="Assiette colorée, suggestion de présentation culinaire illustrative" width={720} height={720} sizes="(max-width: 700px) 100vw, 50vw" preload /><figcaption>Photographie illustrative de démonstration</figcaption></figure> : <div className="welcome-card"><span className="eyebrow">VITE & GOURMAND</span><h2>Une cuisine qui rassemble.</h2><p>Une équipe attentive et 25 ans de savoir-faire pour accompagner vos moments de convivialité.</p></div>}</section>
    <section className="home-menus" aria-labelledby="featured-title"><div className="section-heading"><div><p className="eyebrow">UNE ENVIE, UNE OCCASION</p><h2 id="featured-title">À partager autour de la table.</h2></div><Link className="text-button" href="/menus">Voir tous les menus ↗</Link></div>{menus.length ? <div className="menu-grid">{menus.map((menu) => <MenuCard key={menu.id} menu={menu} />)}</div> : <p>{unavailable ? "Les menus sont momentanément indisponibles. Retrouvez-nous dans un instant." : "De nouveaux menus seront bientôt proposés."}</p>}</section>
    <section className="home-story" aria-labelledby="team-title"><p className="eyebrow">LE GOÛT DU PARTAGE</p><h2 id="team-title">Julie, José et une équipe à vos côtés.</h2><p>Depuis 25 ans, Vite & Gourmand accompagne les repas du quotidien, les fêtes de saison et les événements privés à Bordeaux. Une cuisine généreuse et une attention portée à chaque moment de convivialité.</p></section>
    <section className="home-reviews" aria-labelledby="reviews-title"><h2 id="reviews-title">Vos moments, vos mots.</h2>{reviews.length ? <div className="review-grid">{reviews.map((review) => <figure key={review.id} className="review-card"><p aria-label={`Note : ${review.rating} sur 5`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></p><blockquote>{review.comment}</blockquote><figcaption>{review.isDemo ? "Avis de démonstration validé" : "Avis client validé"}</figcaption></figure>)}</div> : <p>{unavailable ? "Les avis sont momentanément indisponibles." : "Les avis clients validés seront présentés ici."}</p>}</section>
  </div>;
}
