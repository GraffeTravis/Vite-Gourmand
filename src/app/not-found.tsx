import Link from "next/link";
export default function NotFound() {
  return <section className="container page"><h1>Cette page est introuvable</h1><p>Retrouvez les informations disponibles depuis l’accueil.</p><Link className="button" href="/">Revenir à l’accueil</Link></section>;
}
