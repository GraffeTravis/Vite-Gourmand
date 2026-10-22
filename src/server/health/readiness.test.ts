import { describe, expect, it, vi } from "vitest";
import { checkReadiness, isReadinessAuthorized } from "./readiness";

describe("contrôle privé des services", () => {
  const secret = "readiness_test_only_32_characters_long";
  it("reste fermé sans secret, sans en-tête ou avec un autre jeton", () => {
    expect(isReadinessAuthorized(`Bearer ${secret}`, undefined)).toBe(false);
    expect(isReadinessAuthorized(null, secret)).toBe(false);
    expect(isReadinessAuthorized("Bearer wrong", secret)).toBe(false);
    expect(isReadinessAuthorized(`Basic ${secret}`, secret)).toBe(false);
  });
  it("accepte uniquement le jeton Bearer attendu", () => {
    expect(isReadinessAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });
  it("vérifie les deux services et ne divulgue jamais leurs erreurs", async () => {
    const postgres = vi.fn().mockResolvedValue(undefined);
    const mongodb = vi.fn().mockRejectedValue(new Error("mongodb://secret-password@host"));
    const result = await checkReadiness(postgres, mongodb);
    expect(postgres).toHaveBeenCalledOnce();
    expect(mongodb).toHaveBeenCalledOnce();
    expect(result).toEqual({ status: "unavailable", services: { postgres: true, mongodb: false } });
    expect(JSON.stringify(result)).not.toContain("secret-password");
  });
  it("annonce prêt quand les deux bases répondent", async () => {
    expect((await checkReadiness(async () => 1, async () => 1)).status).toBe("ready");
  });
});
