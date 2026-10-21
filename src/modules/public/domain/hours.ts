const weekdays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
type HoursRow = { weekday: number; opensAt: Date | null; closesAt: Date | null; isClosed: boolean };

export function publicHours(rows: HoursRow[]) {
  return weekdays.map((day, index) => {
    const slots = rows.filter((row) => row.weekday === index + 1);
    if (slots.length === 0) return { day, text: "À confirmer" };
    if (slots.every((row) => row.isClosed)) return { day, text: "Fermé" };
    if (slots.some((row) => row.isClosed || !row.opensAt || !row.closesAt)) return { day, text: "À confirmer" };
    // Les colonnes TIME sont des heures locales de prestation, pas des instants à convertir.
    const text = slots.map((row) => `${row.opensAt!.toISOString().slice(11, 16)} – ${row.closesAt!.toISOString().slice(11, 16)}`).sort().join(" / ");
    return { day, text };
  });
}
