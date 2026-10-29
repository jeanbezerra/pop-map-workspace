import { parseHistory, saveDemoSession } from "@/features/map/session-store";
import type { SearchHistoryItem } from "@/features/map/model";

const sample: SearchHistoryItem = {
  id: "session-1",
  url: "https://portoseguro.com.br/aplicacao-a",
  createdAt: "2026-10-29T02:00:00.000Z",
  outcome: "completed",
};

describe("histórico local de demonstração", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  test.each(["{", "null", "{}", "true", '"invalid"'])("ignora conteúdo corrompido ou sem coleção: %s", (raw) => {
    expect(parseHistory(raw)).toEqual([]);
  });

  test("recupera entradas válidas sem aceitar registros de schema incompatível", () => {
    const raw = JSON.stringify([
      sample,
      null,
      { ...sample, id: 42 },
      { ...sample, url: null },
      { ...sample, createdAt: 1793239200000 },
      { ...sample, outcome: "running" },
      { ...sample, id: "session-2", outcome: "partial" },
      { ...sample, id: "session-3", outcome: "cancelled" },
    ]);

    expect(parseHistory(raw)).toEqual([
      sample,
      { ...sample, id: "session-2", outcome: "partial" },
      { ...sample, id: "session-3", outcome: "cancelled" },
    ]);
  });

  test.each(["not-a-date", "", "2026-13-29T02:00:00.000Z", "2026-02-30T02:00:00.000Z"])("descarta data inválida sem impedir recuperação dos demais registros: %s", (createdAt) => {
    const raw = JSON.stringify([{ ...sample, id: "invalid-date", createdAt }, sample]);

    expect(parseHistory(raw)).toEqual([sample]);
  });

  test("mantém o histórico limitado sem reordenar os registros fornecidos", () => {
    const entries = Array.from({ length: 30 }, (_, index) => ({ ...sample, id: `session-${index}` }));

    expect(parseHistory(JSON.stringify(entries))).toEqual(entries.slice(0, 20));
  });

  test("regravar uma sessão atualiza a entrada mais recente sem duplicar seu histórico", () => {
    const notify = jest.fn();
    window.addEventListener("pop-map:demo-sessions-updated", notify);
    try {
      expect(saveDemoSession(sample)).toBe(true);
      expect(saveDemoSession({ ...sample, id: "session-2" })).toBe(true);
      expect(saveDemoSession({ ...sample, outcome: "cancelled" })).toBe(true);

      const stored = parseHistory(localStorage.getItem("pop-map:demo-sessions:v1") ?? "[]");
      expect(stored).toEqual([{ ...sample, outcome: "cancelled" }, { ...sample, id: "session-2" }]);
      expect(notify).toHaveBeenCalledTimes(3);
    } finally {
      window.removeEventListener("pop-map:demo-sessions-updated", notify);
    }
  });

  test("falha de armazenamento não é apresentada como sessão salva", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    const notify = jest.fn();
    window.addEventListener("pop-map:demo-sessions-updated", notify);
    try {
      expect(saveDemoSession(sample)).toBe(false);
      expect(notify).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("pop-map:demo-sessions-updated", notify);
    }
  });
});
