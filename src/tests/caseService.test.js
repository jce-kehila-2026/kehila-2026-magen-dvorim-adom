import { describe, test, expect } from "vitest";

/* -----------------------------
    1. Phone normalization
------------------------------*/
function normalizePhone(phone) {
  return phone.replace(/[^0-9]/g, "");
}

describe("Phone normalization", () => {
  test("removes spaces and dashes", () => {
    expect(normalizePhone("050-123 4567")).toBe("0501234567");
  });

  test("keeps only digits", () => {
    expect(normalizePhone("(050)123-4567")).toBe("0501234567");
  });
});

/* -----------------------------
   2. Optional fields logic
------------------------------*/
describe("Optional fields handling", () => {
  test("empty navigation link becomes null", () => {
    const input = "";
    const result = input.trim() || null;
    expect(result).toBe(null);
  });

  test("filled navigation link stays value", () => {
    const input = "https://maps.com";
    const result = input.trim() || null;
    expect(result).toBe("https://maps.com");
  });

  test("empty first_seen becomes null", () => {
    const input = "";
    const result = input ? input : null;
    expect(result).toBe(null);
  });
});

/* -----------------------------
   3. Duplicate case prevention logic
------------------------------*/
describe("Duplicate case prevention", () => {
  function hasOpenCaseMock(cases, requester_phone) {
    return cases.some(
      (c) =>
        c.requester_phone === requester_phone &&
        (c.status === "open" || c.status === "in_progress")
    );
  }

  test("blocks creation if open case exists", () => {
    const cases = [
      { requester_phone: "0501234567", status: "open" },
    ];

    const result = hasOpenCaseMock(cases, "0501234567");
    expect(result).toBe(true);
  });

  test("allows creation if no open cases", () => {
    const cases = [
      { requester_phone: "0501234567", status: "closed" },
    ];

    const result = hasOpenCaseMock(cases, "0501234567");
    expect(result).toBe(false);
  });
});

/* -----------------------------
   4. Intake form logic
------------------------------*/
describe("Intake form validation", () => {
  function isValidIntakeForm(form) {
    if (!form) return false;

    if (form.status !== "sent") return false;

    if (form.expires_at < new Date()) return false;

    return true;
  }

  test("rejects if no intake form", () => {
    expect(isValidIntakeForm(null)).toBe(false);
  });

  test("rejects expired form", () => {
    const form = {
      status: "sent",
      expires_at: new Date("2000-01-01"),
    };

    expect(isValidIntakeForm(form)).toBe(false);
  });

  test("accepts valid form", () => {
    const form = {
      status: "sent",
      expires_at: new Date("2099-01-01"),
    };

    expect(isValidIntakeForm(form)).toBe(true);
  });
});

/* -----------------------------
   5. Case status transitions
------------------------------*/
describe("Case status transitions", () => {
  function isValidTransition(current, next) {
    const rules = {
      open: ["in_progress", "closed"],
      in_progress: ["closed"],
      closed: ["open"],
    };

    return rules[current]?.includes(next) || false;
  }

  test("open → in_progress allowed", () => {
    expect(isValidTransition("open", "in_progress")).toBe(true);
  });

  test("open → closed allowed", () => {
    expect(isValidTransition("open", "closed")).toBe(true);
  });

  test("in_progress → closed allowed", () => {
    expect(isValidTransition("in_progress", "closed")).toBe(true);
  });

  test("closed → open allowed", () => {
    expect(isValidTransition("closed", "open")).toBe(true);
  });

  test("invalid transition blocked", () => {
    expect(isValidTransition("closed", "in_progress")).toBe(false);
  });
});