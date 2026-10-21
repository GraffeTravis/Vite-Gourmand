export function GET() {
  return Response.json({ status: "ok", service: "vite-et-gourmand" }, { headers: { "Cache-Control": "no-store" } });
}
