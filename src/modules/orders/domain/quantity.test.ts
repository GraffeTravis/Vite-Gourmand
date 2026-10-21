import { describe, expect, it } from "vitest";
import { discountRateForQuantity } from "./quantity";
describe("RM06 et RM07", () => {
  it.each([[10, 10, 0], [10, 14, 0], [10, 15, 10], [20, 24, 0], [20, 25, 10]])("minimum %i, quantité %i : remise %i", (minimum, quantity, rate) => {
    expect(discountRateForQuantity(minimum, quantity)).toBe(rate);
  });
  it.each([[10, 9], [0, 10], [10, 10.5], [10, Infinity]])("refuse les quantités invalides", (minimum, quantity) => {
    expect(() => discountRateForQuantity(minimum, quantity)).toThrow(RangeError);
  });
});
