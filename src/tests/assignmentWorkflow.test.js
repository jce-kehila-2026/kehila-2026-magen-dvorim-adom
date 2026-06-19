import { describe, test, expect, vi, beforeEach } from "vitest";

/* ============================================================
   🔧 FIRESTORE MOCK LAYER
   - Mock all Firestore primitives used by assignmentService
   - This keeps the tests isolated and deterministic
============================================================ */
vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    collection: vi.fn(() => ({})),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    Timestamp: {
      now: () => ({ seconds: Date.now() }),
      fromDate: (d) => d,
    },
  };
});

/* Mock the case service dependency so we can observe status changes without hitting Firestore. */
vi.mock("../services/caseService", () => ({
  updateCaseStatus: vi.fn(),
}));

import { addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { updateCaseStatus } from "../services/caseService";
import {
  assignUserToCase,
  removeAssignment,
  reopenCaseAndCleanConflicts,
  getAssignmentsByCaseIds,
  getAssignableUsers,
} from "../services/assignmentService";
import { AssignmentSchema } from "../services/assignmentSchema";

beforeEach(() => {
  vi.clearAllMocks();

  getDocs.mockReset();
  addDoc.mockReset();
  deleteDoc.mockReset();
  updateCaseStatus.mockClear();
});

const validAssignmentPayload = {
  case_id: "case-123",
  user_id: "vol-456",
  assigned_by: "coord-001",
  required_equipment: ["ladder", "net"],
  notes: "Bring extra gloves",
};

/* ============================================================
   1. ASSIGNMENT SCHEMA VALIDATION
   - Ensure the schema continues to enforce required fields
   - This is the foundation for safe assignment creation
============================================================ */
describe("AssignmentSchema", () => {
  test("accepts a fully valid assignment payload", () => {
    expect(() => AssignmentSchema.parse({
      ...validAssignmentPayload,
      assigned_at: new Date(),
    })).not.toThrow();
  });

  test("rejects missing required fields", () => {
    expect(() =>
      AssignmentSchema.parse({
        ...validAssignmentPayload,
        user_id: "",
        assigned_at: new Date(),
      })
    ).toThrow();
  });

  test("populates defaults for optional fields", () => {
    const parsed = AssignmentSchema.parse({
      case_id: "case-123",
      user_id: "vol-456",
      assigned_by: "coord-001",
    });

    expect(parsed.required_equipment).toEqual([]);
    expect(parsed.assigned_at).toBeInstanceOf(Date);
  });
});

/* ============================================================
   2. ASSIGN USER WORKFLOW
   - Covers the core assignment service behavior
   - Includes success, blocking, and edge cases
============================================================ */
describe("assignUserToCase", () => {
  test("assigns a volunteer when they have no active case", async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    addDoc.mockResolvedValueOnce({ id: "assignment-1" });

    const result = await assignUserToCase(validAssignmentPayload);

    expect(result).toBe("assignment-1");
    expect(addDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned");
  });

  test("blocks assignment when the volunteer already has an active case", async () => {
    getDocs
      .mockResolvedValueOnce({ docs: [
        {
          id: "assign-old",
          data: () => ({ case_id: "other-case", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "other-case",
          data: () => ({ status: "open" }),
        },
      ] });

    await expect(assignUserToCase(validAssignmentPayload))
      .rejects.toThrow("already has an active case");

    expect(addDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).not.toHaveBeenCalled();
  });

  test("allows assignment if the volunteer only has a closed case", async () => {
    getDocs
      .mockResolvedValueOnce({ docs: [
        {
          id: "assign-old",
          data: () => ({ case_id: "closed-case", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "closed-case",
          data: () => ({ status: "closed" }),
        },
      ] });

    addDoc.mockResolvedValueOnce({ id: "assignment-2" });

    const result = await assignUserToCase(validAssignmentPayload);

    expect(result).toBe("assignment-2");
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned");
  });

  test("throws when assignment payload fails schema validation", async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });

    await expect(assignUserToCase({
      ...validAssignmentPayload,
      user_id: "",
    })).rejects.toThrow();

    expect(addDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).not.toHaveBeenCalled();
  });
});

/* ============================================================
   3. REMOVE ASSIGNMENT AND CASE STATUS UPDATE
   - Verifies the case reopens only when no assignments remain
============================================================ */
describe("removeAssignment", () => {
  test("reopens the case when the last assignment is removed", async () => {
    deleteDoc.mockResolvedValueOnce();
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await removeAssignment("assignment-1", "case-123");

    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open");
  });

  test("keeps the case assigned when other assignments still exist", async () => {
    deleteDoc.mockResolvedValueOnce();
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "assignment-2",
          data: () => ({ case_id: "case-123", user_id: "vol-999" }),
        },
      ],
    });

    await removeAssignment("assignment-1", "case-123");

    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).not.toHaveBeenCalled();
  });
});

/* ============================================================
   4. CLOSED HISTORY REOPEN WORKFLOW
   - Covers reopen flow, conflict cleanup, and no-assignment edge cases
============================================================ */
describe("reopenCaseAndCleanConflicts", () => {
  test("returns an empty array and reopens a case when there are no current assignments", async () => {
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await reopenCaseAndCleanConflicts("case-123");

    expect(result).toEqual([]);
    expect(deleteDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {});
  });

  test("removes the conflicting user assignment and reopens the case", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [
        {
          id: "assignment-reopen",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "assignment-other",
          data: () => ({ case_id: "case-999", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "case-999",
          data: () => ({ status: "open" }),
        },
      ] });

    const result = await reopenCaseAndCleanConflicts("case-123");

    expect(result).toEqual([
      { user_id: "vol-456", assignmentId: "assignment-reopen" },
    ]);
    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {});
  });

  test("keeps the current assignment when the volunteer has no other active cases", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [
        {
          id: "assignment-reopen",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [] });

    const result = await reopenCaseAndCleanConflicts("case-123");

  expect(result).toEqual([
  { user_id: "vol-456", assignmentId: "assignment-reopen" },
]);
expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {});
  });
});

/* ============================================================
   5. QUERY UTILITIES
   - Verifies grouping and user listing helpers behave as expected
============================================================ */
describe("assignment query helpers", () => {
  test("getAssignableUsers returns the user list in the expected shape", async () => {
    getDocs.mockResolvedValueOnce({ docs: [
      {
        id: "user-1",
        data: () => ({ full_name: "Volunteer One", phone: "0500000000" }),
      },
    ] });

    const users = await getAssignableUsers();

    expect(users).toEqual([
      { id: "user-1", full_name: "Volunteer One", phone: "0500000000" },
    ]);
  });

  test("getAssignmentsByCaseIds groups assignments correctly", async () => {
    getDocs.mockResolvedValueOnce({ docs: [
      {
        id: "assignment-1",
        data: () => ({ case_id: "case-123", user_id: "vol-456" }),
      },
      {
        id: "assignment-2",
        data: () => ({ case_id: "case-999", user_id: "vol-789" }),
      },
    ] });

    const grouped = await getAssignmentsByCaseIds(["case-123"]);

    expect(grouped).toEqual({
      "case-123": [
        {
          id: "assignment-1",
          case_id: "case-123",
          user_id: "vol-456",
        },
      ],
    });
  });
});

/* ============================================================
   6. FULL WORKFLOW INTEGRATION
   - Simulates the new coordinator flow with assignment and reopen conflict handling
============================================================ */
describe("assignment workflow integration", () => {
  test("assigns a volunteer and then cleans conflicts on reopen", async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    addDoc.mockResolvedValueOnce({ id: "assignment-int-1" });

    const assignmentId = await assignUserToCase(validAssignmentPayload);
    expect(assignmentId).toBe("assignment-int-1");
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned");

    getDocs
      .mockResolvedValueOnce({ empty: false, docs: [
        {
          id: "assignment-int-1",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "assignment-other",
          data: () => ({ case_id: "case-999", user_id: "vol-456" }),
        },
      ] })
      .mockResolvedValueOnce({ docs: [
        {
          id: "case-999",
          data: () => ({ status: "assigned" }),
        },
      ] });

    const cleanup = await reopenCaseAndCleanConflicts("case-123");

    expect(cleanup).toEqual([
      { user_id: "vol-456", assignmentId: "assignment-int-1" },
    ]);
    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {});
  });
});
