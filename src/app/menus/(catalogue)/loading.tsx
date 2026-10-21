// Le chargement du catalogue ne doit pas envoyer un HTTP 200 avant le refus d'une fiche.
export default function LoadingMenus() {
  return <section className="container page" aria-busy="true"><h1>Nos menus</h1><p role="status">Chargement des menus…</p><div className="menu-grid" aria-hidden="true">{[1, 2, 3].map((id) => <div key={id} className="menu-skeleton" />)}</div></section>;
}
