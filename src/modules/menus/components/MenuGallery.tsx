"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuImage } from "../domain/catalogue";

export function MenuGallery({ images, isDemo }: { images: MenuImage[]; isDemo: boolean }) {
  const [selected, setSelected] = useState(0);
  const image = images[selected] ?? images[0];
  if (!image) return <p>Photographie à venir.</p>;
  return <figure className="menu-gallery">
    <Image className="gallery-main" src={image.uri} alt={image.altText} width={960} height={720} sizes="(max-width: 800px) 100vw, 65vw" preload />
    {images.length > 1 && <div className="gallery-thumbnails" role="group" aria-label="Photographies du menu">{images.map((thumbnail, index) => <button key={thumbnail.id} type="button" aria-pressed={index === selected} aria-label={`Afficher la photographie ${index + 1}`} onClick={() => setSelected(index)}><Image src={thumbnail.uri} alt="" width={120} height={90} /></button>)}</div>}
    {isDemo && <figcaption>Suggestions de présentation · photographies illustratives de démonstration.</figcaption>}
  </figure>;
}
