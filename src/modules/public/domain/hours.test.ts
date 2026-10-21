import { describe, expect, it } from "vitest";
import { publicHours } from "./hours";

describe("horaires publics", () => {
  it("affiche les sept jours sans inventer un horaire", () => {
    expect(publicHours([])).toHaveLength(7);
    expect(publicHours([]).every((day) => day.text === "À confirmer")).toBe(true);
  });
  it("conserve l'heure locale stockée en TIME, indépendamment du fuseau du poste", () => {
    const hours = publicHours([{ weekday: 1, opensAt: new Date("1970-01-01T09:00:00Z"), closesAt: new Date("1970-01-01T12:30:00Z"), isClosed: false }]);
    expect(hours[0]).toEqual({ day: "Lundi", text: "09:00 – 12:30" });
  });
  it("signale un jour fermé et une donnée contradictoire sans lui attribuer un créneau", () => {
    expect(publicHours([{ weekday: 7, opensAt: null, closesAt: null, isClosed: true }])[6].text).toBe("Fermé");
    expect(publicHours([{ weekday: 1, opensAt: null, closesAt: null, isClosed: false }])[0].text).toBe("À confirmer");
  });
});
