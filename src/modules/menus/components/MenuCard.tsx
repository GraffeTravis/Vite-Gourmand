import Image from "next/image";
import Link from "next/link";
import { formatPrice, type MenuSummary } from "../domain/catalogue";

export function MenuCard({ menu }: { menu: MenuSummary }) {
  const image = menu.images[0];
  return <article className="menu-card">
    {image && <div className="menu-card-image"><Image src={image.uri} alt={image.altText} width={640} height={480} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 30vw" /></div>}
    <div className="menu-card-body">
      <p className="menu-diet">{menu.diet}</p>
      <h2>{menu.title}</h2>
      <p className="menu-description">{menu.description}</p>
      <p className="menu-price">{formatPrice(menu.price)} <span>/ personne</span></p>
      <p className="menu-meta">À partir de {menu.minimumPeople} personnes</p>
      <p className={`availability ${menu.stock === 0 ? "unavailable" : ""}`}>{menu.stock > 0 ? `${menu.stock} commande${menu.stock > 1 ? "s" : ""} disponible${menu.stock > 1 ? "s" : ""}` : "Actuellement indisponible"}</p>
      {menu.isDemo && <p className="demo-label">Menu et photographie de démonstration</p>}
      <Link href={`/menus/${menu.id}`} className="button" aria-label={`Découvrir le menu ${menu.title}`}>Découvrir le menu <span aria-hidden="true">↗</span></Link>
    </div>
  </article>;
}
