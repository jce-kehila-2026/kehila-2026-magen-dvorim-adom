import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock geocoding service to avoid real API calls during unit tests
vi.mock("../services/geocodingService", () => ({
  geocodeCaseLocation: vi.fn().mockResolvedValue({
    location_lat: 31.78,
    location_lng: 35.20,
    location_display_name: "Jerusalem",
    location_source: "Jerusalem, Israel",
  }),
}));

/* ============================================================
   🔧 FIRESTORE MOCK LAYER
   - We mock Firebase so no real DB is used
   - All DB behavior is controlled in tests
============================================================ */
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual, // ✅ keep real exports like getFirestore

    // ✅ override only what we need
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    doc: vi.fn(() => ({})),
    updateDoc: vi.fn(),

    Timestamp: {
      now: () => ({ seconds: Date.now() }),
      fromDate: (d) => d,
    },
  };
});

import {
  addDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import {
  createCase,
  getCasesForCoordinator,
  updateCaseStatus,
} from "../services/caseService";

import {
  getValidIntakeFormForRequester,
  createIntakeForm,
  markIntakeFormSubmitted,
} from "../services/intakeFormService";

import { CaseSchema } from "../services/caseSchema";
import { IntakeFormSchema } from "../services/intakeFormSchema";

/* ============================================================
   🔄 RESET MOCKS BEFORE EACH TEST
============================================================ */
beforeEach(() => {
  vi.clearAllMocks();
});

/* ============================================================
   🧱 SHARED VALID INPUT
   - Used across multiple tests
============================================================ */
const validInput = {
  requester_first_name: "John",
  requester_last_name: "Doe",
  requester_phone: "0501234567",
  coordinator_phone: "0509999999",
  city: "Tel Aviv",
  street: "Main",
  location_description: "Near building",
  height_from_ground: 2,
  floor: "1",
  urgency: "low",
};


/* ============================================================
   ✅ 1. CASE SCHEMA VALIDATION
   - Pure validation (Zod)
============================================================ */
describe("CaseSchema validation", () => {

  test("accepts fully valid data", () => {
    expect(() => CaseSchema.parse({
      ...validInput,
      coordinator_id: "coord1",
    })).not.toThrow();
  });

  test("rejects missing required fields", () => {
    expect(() =>
      CaseSchema.parse({
        ...validInput,
        requester_first_name: "",
        coordinator_id: "coord1",
      })
    ).toThrow();
  });

  test("rejects invalid enum values", () => {
    expect(() =>
      CaseSchema.parse({
        ...validInput,
        urgency: "urgent", // invalid
        coordinator_id: "coord1",
      })
    ).toThrow();
  });

  test("rejects non-positive height", () => {
    expect(() =>
      CaseSchema.parse({
        ...validInput,
        height_from_ground: 0,
        coordinator_id: "coord1",
      })
    ).toThrow();
  });

  test("accepts optional nullable fields", () => {
    expect(() =>
      CaseSchema.parse({
        ...validInput,
        coordinator_id: "coord1",
        navigation_link: null,
        first_seen: null,
      })
    ).not.toThrow();
  });
});


/* ============================================================
   ✅ 2. CREATE CASE (MAIN FEATURE)
============================================================ */
describe("createCase", () => {

  test("✅ creates case successfully", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({ docs: [] });

    addDoc.mockResolvedValue({ id: "case1" });

    const id = await createCase(validInput);

    expect(id).toBe("case1");
  });


  test("🚫 blocks duplicate active cases", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              requester_phone: "0501234567",
              status: "open",
            }),
          },
        ],
      });

    await expect(createCase(validInput))
      .rejects.toThrow("active case");
  });


  test("🚫 detects duplicates across different phone formats", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              requester_phone: "0501234567",
              status: "open",
            }),
          },
        ],
      });

    await expect(
      createCase({
        ...validInput,
        requester_phone: "050-123 4567",
      })
    ).rejects.toThrow();
  });


  test("🚫 fails if coordinator not found", async () => {
    getDocs.mockResolvedValueOnce({ empty: true });

    await expect(createCase(validInput))
      .rejects.toThrow("Coordinator not found");
  });


  test("🚫 fails schema validation", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({ docs: [] });

    await expect(
      createCase({ ...validInput, requester_first_name: "" })
    ).rejects.toThrow("Invalid case data");
  });


  test("💥 handles Firestore failure", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({ docs: [] });

    addDoc.mockRejectedValue(new Error("DB crash"));

    await expect(createCase(validInput))
      .rejects.toThrow("DB crash");
  });


  test("🧱 survives malformed DB data", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        docs: [
          { data: () => null },
          { data: () => ({}) },
        ],
      });

    addDoc.mockResolvedValue({ id: "safe" });

    const result = await createCase(validInput);

    expect(result).toBe("safe");
  });
});


/* ============================================================
   ✅ 3. GET CASES
============================================================ */
describe("getCasesForCoordinator", () => {

  test("returns only matching cases", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        forEach: (cb) => {
          cb({ id: "1", data: () => ({ coordinator_id: "coord1" }) });
          cb({ id: "2", data: () => ({ coordinator_id: "other" }) });
        },
      });

    const result = await getCasesForCoordinator("050999");

    expect(result.length).toBe(1);
  });

  test("throws if coordinator not found", async () => {
    getDocs.mockResolvedValueOnce({ empty: true });

    await expect(
      getCasesForCoordinator("050000")
    ).rejects.toThrow();
  });
});


/* ============================================================
   ✅ 4. UPDATE CASE STATUS
============================================================ */
describe("updateCaseStatus", () => {

  test("✅ sets closed_at when closing", async () => {
    await updateCaseStatus("id1", "closed");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "closed",
        closed_at: expect.anything(),
      })
    );
  });

  test("✅ clears closed_at when reopening", async () => {
    await updateCaseStatus("id1", "open");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        closed_at: null,
      })
    );
  });

test("🚫 rejects invalid status", async () => {
  await expect(
    updateCaseStatus("id1", "banana")
  ).rejects.toThrow("Invalid status");
});
});


/* ============================================================
   ✅ 5. INTAKE FORM SCHEMA
============================================================ */
describe("IntakeFormSchema", () => {

  const valid = {
    requester_phone: "0501234567",
    coordinator_id: "coord1",
    status: "sent",
    sent_at: new Date(),
    expires_at: new Date("2099-01-01"),
  };

  test("accepts valid data", () => {
    expect(() => IntakeFormSchema.parse(valid)).not.toThrow();
  });

  test("rejects missing phone", () => {
    expect(() =>
      IntakeFormSchema.parse({ ...valid, requester_phone: "" })
    ).toThrow();
  });

  test("rejects invalid status", () => {
    expect(() =>
      IntakeFormSchema.parse({ ...valid, status: "invalid" })
    ).toThrow();
  });
});


/* ============================================================
   ✅ 6. INTAKE FORM SERVICE
============================================================ */
describe("Intake form service", () => {

  test("returns valid intake form", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "form1",
            data: () => ({
              expires_at: {
                toDate: () => new Date("2099-01-01"),
              },
            }),
          },
        ],
      });

    const result = await getValidIntakeFormForRequester({
      requester_phone: "050",
      coordinator_phone: "050",
    });

    expect(result.id).toBe("form1");
  });


  test("returns null if expired", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            data: () => ({
              expires_at: {
                toDate: () => new Date("2000-01-01"),
              },
            }),
          },
        ],
      });

    const result = await getValidIntakeFormForRequester({
      requester_phone: "050",
      coordinator_phone: "050",
    });

    expect(result).toBe(null);
  });


  test("creates intake form", async () => {
    getDocs
    .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
    .mockResolvedValueOnce({ empty: true, docs: [] })
    .mockResolvedValueOnce({ empty: true, docs: [] });

addDoc.mockResolvedValueOnce({ id: "form1" });

    await createIntakeForm({
      requester_phone: "050",
      coordinator_phone: "050",
    });

    expect(addDoc).toHaveBeenCalled();
  });


  test("blocks duplicate intake form", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [{ id: "coord1" }] })
      .mockResolvedValueOnce({ empty: false });

    await expect(
      createIntakeForm({
        requester_phone: "050",
        coordinator_phone: "050",
      })
    ).rejects.toThrow("active form");
  });


  test("marks intake form as submitted", async () => {
    await markIntakeFormSubmitted("form1", "case1");

    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: "submitted",
        case_id: "case1",
      })
    );
  });
});