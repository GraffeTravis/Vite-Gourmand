"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { CatalogPage } from "../domain/catalogue";
import { MenuCard } from "./MenuCard";

export function CatalogBrowser({ initialData, initialQuery, initialError = null }: {
  initialData: CatalogPage | null; initialQuery: string; initialError?: string | null;
}) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const firstRender = useRef(true);
  const generation = useRef(0);
  const parameters = new URLSearchParams(query);

  useEffect(() => {
    const onPopState = () => { setQuery(window.location.search.slice(1)); };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const current = ++generation.current;
    const controller = new AbortController();
    setBusy(true);
    const timeout = window.setTimeout(async () => {
      window.history.replaceState(window.history.state, "", `/menus${query ? `?${query}` : ""}`);
      try {
        const response = await fetch(`/api/menus${query ? `?${query}` : ""}`, { signal: controller.signal, cache: "no-store" });
        const result = await response.json();
        if (controller.signal.aborted || current !== generation.current) return;
        if (!response.ok) throw new Error(result.message ?? "Le catalogue est temporairement indisponible.");
        setData(result as CatalogPage);
        setError(null);
      } catch (caught) {
        if (controller.signal.aborted || current !== generation.current) return;
        setError(caught instanceof Error && caught.message !== "Failed to fetch" ? caught.message : "Le catalogue est temporairement indisponible. Réessayez dans un instant.");
      } finally {
        if (!controller.signal.aborted && current === generation.current) setBusy(false);
      }
    }, 200);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, attempt]);

  function changeFilter(name: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(name, value); else next.delete(name);
    if (name !== "page") next.delete("page");
    setQuery(next.toString());
  }
  function reset() { setQuery(""); setAttempt((value) => value + 1); }
  function submit(event: FormEvent) { event.preventDefault(); setAttempt((value) => value + 1); }

  return <div className="catalog-layout">
    <aside className="catalog-sidebar" aria-labelledby="filters-title">
      <h2 id="filters-title">Affiner les menus</h2>
      <button className="filter-toggle" type="button" aria-expanded={expanded} aria-controls="menu-filters" onClick={() => setExpanded(!expanded)}>{expanded ? "Masquer les filtres" : "Afficher les filtres"}</button>
      <form id="menu-filters" className={`filter-fields ${expanded ? "expanded" : ""}`} action="/menus" method="get" onSubmit={submit}>
        <label className="field">Prix maximum par personne (€)<input name="priceCap" type="number" min="0" max="99999999.99" step="0.01" placeholder="Sans limite" value={parameters.get("priceCap") ?? ""} onChange={(event) => changeFilter("priceCap", event.target.value)} /></label>
        <fieldset className="price-range"><legend>Fourchette de prix par personne</legend><div>
          <label className="field">De (€)<input name="priceMin" type="number" min="0" step="0.01" placeholder="Minimum" value={parameters.get("priceMin") ?? ""} onChange={(event) => changeFilter("priceMin", event.target.value)} /></label>
          <label className="field">À (€)<input name="priceMax" type="number" min="0" step="0.01" placeholder="Maximum" value={parameters.get("priceMax") ?? ""} onChange={(event) => changeFilter("priceMax", event.target.value)} /></label>
        </div></fieldset>
        <label className="field">Thème<select name="theme" value={parameters.get("theme") ?? ""} onChange={(event) => changeFilter("theme", event.target.value)}><option value="">Tous les thèmes</option>{data?.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}</select></label>
        <label className="field">Régime alimentaire<select name="diet" value={parameters.get("diet") ?? ""} onChange={(event) => changeFilter("diet", event.target.value)}><option value="">Tous les régimes</option>{data?.diets.map((diet) => <option key={diet.id} value={diet.id}>{diet.label}</option>)}</select></label>
        <label className="field">Nombre de convives<input name="people" type="number" min="1" step="1" placeholder="Votre groupe" aria-describedby="people-hint" value={parameters.get("people") ?? ""} onChange={(event) => changeFilter("people", event.target.value)} /></label>
        <p id="people-hint" className="field-hint">Les menus proposés respecteront la taille de votre groupe.</p>
        <button className="button" type="submit">Appliquer les filtres</button>
        <button type="button" className="text-button" onClick={reset}>Réinitialiser les filtres</button>
      </form>
    </aside>
    <section className="catalog-results" aria-labelledby="results-title" aria-busy={busy}>
      <div className="results-heading"><h2 id="results-title">Nos menus</h2><p role="status" aria-live="polite">{busy ? "Actualisation des menus…" : error ? "Résultats indisponibles" : `${data?.total ?? 0} menu${data?.total === 1 ? "" : "s"} à découvrir`}</p></div>
      {error ? <div className="notice error-notice" role="alert" aria-labelledby="catalog-error-title"><h3 id="catalog-error-title">Le catalogue ne peut pas être affiché</h3><p>{error}</p><button className="button" type="button" onClick={() => setAttempt((value) => value + 1)}>Réessayer</button></div> : data?.menus.length ? <>
        <div className="menu-grid">{data.menus.map((menu) => <MenuCard key={menu.id} menu={menu} />)}</div>
        {data.pageCount > 1 && <nav className="pagination" aria-label="Pages du catalogue"><button type="button" disabled={data.page === 1} onClick={() => changeFilter("page", String(data.page - 1))}>Page précédente</button><span>Page {data.page} sur {data.pageCount}</span><button type="button" disabled={data.page >= data.pageCount} onClick={() => changeFilter("page", String(data.page + 1))}>Page suivante</button></nav>}
      </> : <div className="notice empty-catalog"><h3>{data?.total ? "Cette page ne contient aucun menu" : "Aucun menu ne correspond à votre recherche"}</h3><p>Essayez d’élargir vos critères ou retrouvez l’ensemble des menus disponibles.</p><button type="button" className="button" onClick={reset}>Voir tous les menus</button></div>}
    </section>
  </div>;
}
