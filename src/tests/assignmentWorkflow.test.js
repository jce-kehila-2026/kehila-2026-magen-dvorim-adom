import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    collection: vi.fn(() => ({})),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
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

vi.mock("../services/caseService", () => ({
  updateCaseStatus: vi.fn(),
}));

import {
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { updateCaseStatus } from "../services/caseService";
import {
  assignUserToCase,
  removeAssignment,
  reopenCaseAndCleanConflicts,
  getAssignmentsByCaseIds,
  getAssignableUsers,
  backfillAssignedVolunteerIds,
} from "../services/assignmentService";
import { AssignmentSchema } from "../services/assignmentSchema";

beforeEach(() => {
  vi.clearAllMocks();
  getDocs.mockReset();
  getDoc.mockReset();
  addDoc.mockReset();
  deleteDoc.mockReset();
  updateDoc.mockReset();
  updateCaseStatus.mockClear();
});

const validAssignmentPayload = {
  case_id: "case-123",
  user_id: "vol-456",
  assigned_by: "coord-001",
  required_equipment: ["ladder", "net"],
  notes: "Bring extra gloves",
};

const REOPEN_RESET_FIELDS = {
  result_status: null,
  result_notes: null,
  closed_by: null,
  closed_at: null,
  feedback_token: null,
  feedback_submitted: false,
  assigned_volunteer_ids: [],
};

describe("AssignmentSchema", () => {
  test("accepts a fully valid assignment payload", () => {
    expect(() =>
      AssignmentSchema.parse({
        ...validAssignmentPayload,
        assigned_at: new Date(),
      })
    ).not.toThrow();
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

describe("assignUserToCase", () => {
  test("assigns a volunteer when they have no active case", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] }) // existingForCase
      .mockResolvedValueOnce({ empty: true, docs: [] }); // getActiveUserAssignments

    addDoc.mockResolvedValueOnce({ id: "assignment-1" });

    const result = await assignUserToCase(validAssignmentPayload);

    expect(result).toBe("assignment-1");
    expect(addDoc).toHaveBeenCalled();
    expect(deleteDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-456"],
    });
  });

  test("reassigns a volunteer by replacing the existing assignment for the case", async () => {
    // Previously this scenario threw "This case already has a volunteer
    // assigned." — Reassign Volunteer always hit this, since an
    // "assigned" case always already has exactly one assignment doc.
    // Now the existing assignment is removed and replaced instead.
    getDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "assignment-existing",
            data: () => ({ case_id: "case-123", user_id: "vol-999" }),
          },
        ],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] }); // new volunteer has no active case

    deleteDoc.mockResolvedValueOnce();
    addDoc.mockResolvedValueOnce({ id: "assignment-new" });

    const result = await assignUserToCase(validAssignmentPayload);

    expect(result).toBe("assignment-new");
    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(addDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-456"],
    });
  });

  test("blocks assignment when the volunteer already has an active case", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "assign-old",
            data: () => ({ case_id: "other-case", user_id: "vol-456" }),
          },
        ],
      })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "other-case",
            data: () => ({ status: "open" }),
          },
        ],
      });

    await expect(assignUserToCase(validAssignmentPayload)).rejects.toThrow(
      "already has an active case"
    );

    expect(deleteDoc).not.toHaveBeenCalled();
    expect(addDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).not.toHaveBeenCalled();
  });

  test("allows assignment if the volunteer only has a closed case", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "assign-old",
            data: () => ({ case_id: "closed-case", user_id: "vol-456" }),
          },
        ],
      })
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "closed-case",
            data: () => ({ status: "closed" }),
          },
        ],
      });

    addDoc.mockResolvedValueOnce({ id: "assignment-2" });

    const result = await assignUserToCase(validAssignmentPayload);

    expect(result).toBe("assignment-2");
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-456"],
    });
  });

  test("throws when assignment payload fails schema validation", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] }) // existingForCase
      .mockResolvedValueOnce({ empty: true, docs: [] }); // getActiveUserAssignments

    await expect(
      assignUserToCase({
        ...validAssignmentPayload,
        user_id: "",
      })
    ).rejects.toThrow();

    expect(addDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).not.toHaveBeenCalled();
  });
});

describe("removeAssignment", () => {
  test("reopens the case when the last assignment is removed", async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ user_id: "vol-456" }),
    });
    deleteDoc.mockResolvedValueOnce();
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await removeAssignment("assignment-1", "case-123");

    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {
      assigned_volunteer_ids: arrayRemove("vol-456"),
    });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  test("keeps the case assigned when other assignments still exist", async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ user_id: "vol-456" }),
    });
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
    // Status doesn't change, so the volunteer is dropped from the case's
    // array via a direct updateDoc instead of going through updateCaseStatus.
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      assigned_volunteer_ids: arrayRemove("vol-456"),
    });
  });

  test("still removes the assignment if the assignment doc no longer exists", async () => {
    getDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    });
    deleteDoc.mockResolvedValueOnce();
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    await removeAssignment("assignment-1", "case-123");

    expect(deleteDoc).toHaveBeenCalled();
    // No userId available, so assigned_volunteer_ids isn't touched —
    // just the status reset.
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "open", {});
  });
});

describe("reopenCaseAndCleanConflicts", () => {
  test("returns an empty array and reopens a case when there are no current assignments", async () => {
    getDocs.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await reopenCaseAndCleanConflicts("case-123");

    expect(result).toEqual([]);
    expect(deleteDoc).not.toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith(
      "case-123",
      "open",
      REOPEN_RESET_FIELDS
    );
  });

  test("removes all assignments and reopens the case", async () => {
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "assignment-reopen",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
      ],
    });

    const result = await reopenCaseAndCleanConflicts("case-123");

    expect(result).toEqual([
      { user_id: "vol-456", assignmentId: "assignment-reopen" },
    ]);
    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith(
      "case-123",
      "open",
      REOPEN_RESET_FIELDS
    );
  });
});

describe("backfillAssignedVolunteerIds", () => {
  test("only updates cases whose assigned_volunteer_ids is missing or out of sync", async () => {
    getDocs
      .mockResolvedValueOnce({
        // assignments collection
        docs: [
          { id: "a1", data: () => ({ case_id: "case-1", user_id: "vol-1" }) },
          { id: "a2", data: () => ({ case_id: "case-2", user_id: "vol-2" }) },
        ],
      })
      .mockResolvedValueOnce({
        // cases collection
        docs: [
          {
            id: "case-1",
            data: () => ({ assigned_volunteer_ids: ["vol-1"] }), // already correct
          },
          {
            id: "case-2",
            data: () => ({}), // missing the field — needs backfilling
          },
          {
            id: "case-3",
            data: () => ({ assigned_volunteer_ids: [] }), // no assignments, already correct
          },
        ],
      });

    updateDoc.mockResolvedValue();

    const result = await backfillAssignedVolunteerIds();

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      assigned_volunteer_ids: ["vol-2"],
    });
    expect(result).toEqual({ updatedCount: 1, skippedCount: 2 });
  });
});

describe("assignment query helpers", () => {
  test("getAssignableUsers returns the user list in the expected shape", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "user-1",
          data: () => ({ full_name: "Volunteer One", phone: "0500000000" }),
        },
      ],
    });

    const users = await getAssignableUsers();

    expect(users).toEqual([
      { id: "user-1", full_name: "Volunteer One", phone: "0500000000" },
    ]);
  });

  test("getAssignmentsByCaseIds groups assignments correctly", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "assignment-1",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
        {
          id: "assignment-2",
          data: () => ({ case_id: "case-999", user_id: "vol-789" }),
        },
      ],
    });

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

describe("assignment workflow integration", () => {
  test("assigns a volunteer and then cleans conflicts on reopen", async () => {
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    addDoc.mockResolvedValueOnce({ id: "assignment-int-1" });

    const assignmentId = await assignUserToCase(validAssignmentPayload);

    expect(assignmentId).toBe("assignment-int-1");
    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-456"],
    });

    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "assignment-int-1",
          data: () => ({ case_id: "case-123", user_id: "vol-456" }),
        },
      ],
    });

    const cleanup = await reopenCaseAndCleanConflicts("case-123");

    expect(cleanup).toEqual([
      { user_id: "vol-456", assignmentId: "assignment-int-1" },
    ]);
    expect(deleteDoc).toHaveBeenCalled();
    expect(updateCaseStatus).toHaveBeenCalledWith(
      "case-123",
      "open",
      REOPEN_RESET_FIELDS
    );
  });

  test("reassigns a volunteer and the case still reopens cleanly afterward", async () => {
    // Covers the path that was previously broken end-to-end: assign,
    // reassign to someone else, then reopen — making sure
    // assigned_volunteer_ids stays correct through all three steps.
    getDocs
      .mockResolvedValueOnce({ empty: true, docs: [] }) // existingForCase (first assign)
      .mockResolvedValueOnce({ empty: true, docs: [] }); // getActiveUserAssignments

    addDoc.mockResolvedValueOnce({ id: "assignment-first" });

    await assignUserToCase(validAssignmentPayload);

    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-456"],
    });

    // Reassign to a different volunteer.
    getDocs
      .mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: "assignment-first",
            data: () => ({ case_id: "case-123", user_id: "vol-456" }),
          },
        ],
      })
      .mockResolvedValueOnce({ empty: true, docs: [] });

    deleteDoc.mockResolvedValueOnce();
    addDoc.mockResolvedValueOnce({ id: "assignment-second" });

    await assignUserToCase({
      ...validAssignmentPayload,
      user_id: "vol-789",
    });

    expect(updateCaseStatus).toHaveBeenCalledWith("case-123", "assigned", {
      assigned_volunteer_ids: ["vol-789"],
    });

    // Now reopen — should clean up whatever assignment is currently there.
    getDocs.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "assignment-second",
          data: () => ({ case_id: "case-123", user_id: "vol-789" }),
        },
      ],
    });

    const cleanup = await reopenCaseAndCleanConflicts("case-123");

    expect(cleanup).toEqual([
      { user_id: "vol-789", assignmentId: "assignment-second" },
    ]);
    expect(updateCaseStatus).toHaveBeenCalledWith(
      "case-123",
      "open",
      REOPEN_RESET_FIELDS
    );
  });
});