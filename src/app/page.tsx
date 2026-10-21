import Link from "next/link";

export default function Home() {
  return <div className="container">
    <section className="hero" aria-labelledby="titre-accueil"><div>
      <p className="eyebrow">LE GOÛT DU PARTAGE, DEPUIS 25 ANS</p>
      <h1 id="titre-accueil">De bons moments,<br />autour d’une belle table.</h1>
      <p>À Bordeaux, Julie et José vous accompagnent avec des menus pour vos repas du quotidien, vos fêtes de saison et vos événements privés.</p>
      <Link className="button" href="/menus">Découvrir les menus <span aria-hidden="true">↗</span></Link>
    </div><div className="welcome-card"><span className="eyebrow">VITE & GOURMAND</span><h2>Une cuisine qui rassemble.</h2><p>Une équipe attentive et 25 ans de savoir-faire pour accompagner vos moments de convivialité.</p></div></section>
    <section className="notice" aria-label="État du développement"><h2>Le site prend forme</h2><p>Cette première version installe les fondations de l’application. Le catalogue, la commande et les espaces personnels seront ouverts au fil du développement.</p></section>
  </div>;
}
