import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostgres } from "@/server/db/postgres";
import { getServerEnvironment } from "@/server/config";
import { readMenuDetail } from "@/modules/menus/server/catalogue";
import { foodCategoryLabels, formatPrice, type MenuDetail } from "@/modules/menus/domain/catalogue";
import { MenuGallery } from "@/modules/menus/components/MenuGallery";

export const metadata: Metadata = { title: "Détail d’un menu" };
export const dynamic = "force-dynamic";

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id) || Number(id) > 2_147_483_647) notFound();
  let menu: MenuDetail | null;
  try { menu = await readMenuDetail(getPostgres(), Number(id), getServerEnvironment().APP_ENV !== "production"); }
  catch { return <section className="container page"><h1>Ce menu est momentanément indisponible</h1><p>Nous ne pouvons pas afficher ses informations pour le moment.</p><Link className="button" href="/menus">Revenir au catalogue</Link></section>; }
  if (!menu) notFound();
  return <article className="container page menu-detail">
    <nav className="breadcrumb" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span aria-hidden="true">/</span><Link href="/menus">Tous les menus</Link><span aria-hidden="true">/</span><span aria-current="page">{menu.title}</span></nav>
    <header className="detail-heading"><p className="eyebrow">{menu.theme} · {menu.diet}</p><h1>{menu.title}</h1><p>{menu.description}</p>{menu.isDemo && <p className="demo-label">Exemple de menu : composition, allergènes et photographies fictifs.</p>}</header>
    <div className="detail-layout"><div>
      <MenuGallery images={menu.images} isDemo={menu.isDemo} />
      <section className="meal-section" aria-labelledby="meal-title"><h2 id="meal-title">Au fil du repas</h2><div className="meal-grid">{menu.foods.map((food) => <section key={food.id} className="food-item"><p className="eyebrow">{foodCategoryLabels[food.category] ?? "Plat"}</p><h3>{food.name}</h3>{food.description && <p>{food.description}</p>}<p className="food-allergens"><strong>Allergènes :</strong> {food.allergens.length ? food.allergens.join(", ") : "aucun déclaré après vérification"}.</p></section>)}</div></section>
      <section className="notice allergens-notice" aria-labelledby="allergens-title"><h2 id="allergens-title">Allergènes & bon à savoir</h2><p>Les allergènes déclarés sont indiqués pour chaque plat. Signalez toute allergie à l’équipe avant une prestation.</p>{menu.isDemo && <p className="demo-label">Ces compositions servent uniquement à la démonstration.</p>}</section>
    </div><aside className="order-summary" aria-labelledby="menu-summary-title"><h2 id="menu-summary-title">À votre table</h2><p className="menu-price">{formatPrice(menu.price)} <span>/ personne</span></p><dl><div><dt>Minimum</dt><dd>{menu.minimumPeople} personnes</dd></div><div><dt>Disponibilité</dt><dd>{menu.stock} commande{menu.stock > 1 ? "s" : ""}</dd></div></dl><p className="discount-note">10 % de remise sur le menu dès {menu.minimumPeople + 5} personnes.</p>
      <section className="menu-conditions" aria-labelledby="conditions-title"><h3 id="conditions-title">Conditions importantes</h3><p>{menu.conditions}</p></section>
      <p className="delivery-note">Livraison gratuite dans Bordeaux. Hors Bordeaux : 5 € + 0,59 €/km, calculés sur le trajet aller.</p>
      <button className="button" type="button" disabled>{menu.stock === 0 ? "Menu indisponible" : "Commander ce menu"}</button><p className="field-hint">Les commandes ne sont pas encore ouvertes.</p>
    </aside></div>
  </article>;
}
