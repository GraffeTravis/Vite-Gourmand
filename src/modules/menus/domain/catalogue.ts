export type MenuImage = { id: number; uri: string; altText: string };
export type MenuSummary = {
  id: number; title: string; description: string; price: string;
  minimumPeople: number; stock: number; theme: string; diet: string;
  isDemo: boolean; images: MenuImage[];
};
export type MenuDetail = MenuSummary & {
  conditions: string;
  foods: { id: number; name: string; description: string | null; category: string; allergens: string[] }[];
};
export type CatalogPage = {
  menus: MenuSummary[]; total: number; page: number; pageCount: number;
  themes: { id: number; label: string }[]; diets: { id: number; label: string }[];
};

export function isSafeMenuImage(uri: string) {
  // Stockage local contrôlé pour L2 ; l'adaptateur de téléversement sera traité en L6.
  return /^\/images\/[a-zA-Z0-9_/-]+\.(?:jpe?g|png|webp|avif)$/.test(uri) && !uri.includes("..");
}

export function formatPrice(value: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(value));
}

export const foodCategoryLabels: Record<string, string> = { STARTER: "Entrée", MAIN: "Plat", DESSERT: "Dessert" };
