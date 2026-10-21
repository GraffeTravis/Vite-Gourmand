import { describe, expect, it } from "vitest";
import { calculateMenuPrice, formatEuroAmount, parseEuroAmount } from "./pricing";

describe("D01 — prix par personne, remise et centimes", () => {
  it.each([[8, 8, 0], [8, 12, 0], [8, 13, 10], [12, 17, 10], [20, 24, 0], [20, 25, 10]])(
    "minimum %i et quantité %i : %i %%", (minimumPeople, numberPeople, discountRate) => {
      expect(calculateMenuPrice({ unitPrice: "19.99", minimumPeople, numberPeople, shippingCost: "0" }).discountRate).toBe(discountRate);
    },
  );
  it("arrondit une demi-centime vers le haut et ne remet pas la livraison", () => {
    expect(calculateMenuPrice({ unitPrice: "0.01", minimumPeople: 10, numberPeople: 15, shippingCost: "7.95" })).toEqual({
      unitPriceApplied: "0.01", menuSubtotal: "0.15", discountRate: 10,
      discountAmount: "0.02", shippingCost: "7.95", totalAmount: "8.08",
    });
  });
  it("conserve exactement des montants décimaux", () => {
    const result = calculateMenuPrice({ unitPrice: "19.99", minimumPeople: 10, numberPeople: 15, shippingCost: "16.80" });
    expect(result).toMatchObject({ menuSubtotal: "299.85", discountAmount: "29.99", totalAmount: "286.66" });
  });
  it.each(["-1", "1.001", "NaN", "Infinity", "1e3", " 10", "01.00", "1,50", "", "10000000000"])("refuse le montant %s", (value) => {
    expect(() => parseEuroAmount(value)).toThrow(RangeError);
  });
  it("normalise les euros en centimes", () => {
    expect(formatEuroAmount(parseEuroAmount("12.3"))).toBe("12.30");
  });
  it("refuse les débordements SQL", () => {
    expect(() => calculateMenuPrice({ unitPrice: "99999999.99", minimumPeople: 1, numberPeople: 10001, shippingCost: "0" })).toThrow(RangeError);
  });
});
