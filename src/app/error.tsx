"use client";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="container page" role="alert"><h1>La page n’a pas pu être affichée</h1><p>Vous pouvez réessayer dans un instant.</p><button className="button" onClick={reset}>Réessayer</button></section>;
}
