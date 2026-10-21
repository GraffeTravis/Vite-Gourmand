import { discountRateForQuantity } from "./quantity";

// D01 : calcul en centimes entiers ; arrondi commercial, une seule fois sur la remise.
export function parseEuroAmount(value: string): bigint {
  if (!/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/.test(value)) {
    throw new RangeError("Montant en euros invalide");
  }
  const [euros, decimals = ""] = value.split(".");
  return BigInt(euros) * 100n + BigInt(decimals.padEnd(2, "0"));
}

export function formatEuroAmount(cents: bigint): string {
  if (cents < 0n) throw new RangeError("Montant négatif");
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, "0")}`;
}

export function calculateMenuPrice(input: {
  unitPrice: string;
  minimumPeople: number;
  numberPeople: number;
  shippingCost: string;
}) {
  const discountRate = discountRateForQuantity(input.minimumPeople, input.numberPeople);
  const unitPrice = parseEuroAmount(input.unitPrice);
  const shippingCost = parseEuroAmount(input.shippingCost);
  const subtotal = unitPrice * BigInt(input.numberPeople);
  const discount = (subtotal * BigInt(discountRate) + 50n) / 100n;
  const total = subtotal - discount + shippingCost;
  // Capacité des colonnes PostgreSQL NUMERIC(12,2), vérifiée avant persistance.
  if (total > 999_999_999_999n || subtotal > 999_999_999_999n || unitPrice > 9_999_999_999n) {
    throw new RangeError("Montant hors capacité de stockage");
  }
  return {
    unitPriceApplied: formatEuroAmount(unitPrice),
    menuSubtotal: formatEuroAmount(subtotal),
    discountRate,
    discountAmount: formatEuroAmount(discount),
    shippingCost: formatEuroAmount(shippingCost),
    totalAmount: formatEuroAmount(total),
  };
}
