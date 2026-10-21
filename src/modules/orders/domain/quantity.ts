// RM06/RM07 : le seuil dépend du minimum du menu, jamais d'une constante universelle.
export function discountRateForQuantity(minimum: number, quantity: number): 0 | 10 {
  if (!Number.isSafeInteger(minimum) || minimum < 1) throw new RangeError("Minimum invalide");
  if (!Number.isSafeInteger(quantity) || quantity < minimum) throw new RangeError("Quantité inférieure au minimum du menu");
  return quantity - minimum >= 5 ? 10 : 0;
}
