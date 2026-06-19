import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReportsStats } from "../services/reportService";

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((db, name) => name),
  getDocs: vi.fn(),
}));

import { getDocs } from "firebase/firestore";

const mockSnapshot = (items) => ({
  docs: items.map((item, index) => ({
    id: item.id || `doc-${index}`,
    data: () => item,
  })),
});

describe("getReportsStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates case and user statistics correctly", async () => {
    const mockCases = [
      { id: "case-1", status: "open", urgency: "high", city: "Haifa" },
      { id: "case-2", status: "assigned", urgency: "medium", city: "Haifa" },
      {
        id: "case-3",
        status: "closed",
        urgency: "low",
        city: "Jerusalem",
        result_status: "evacuated_by_volunteer",
      },
      {
        id: "case-4",
        status: "closed",
        urgency: "low",
        city: "Tel Aviv",
        result_status: "remains_in_place_without_treatment",
      },
    ];

    const mockUsers = [
      { id: "user-1", role: "admin", is_available: true },
      { id: "user-2", role: "coordinator", is_available: true },
      { id: "user-3", role: "volunteer", is_available: true },
      { id: "user-4", role: "volunteer", is_available: false },
      { id: "user-5", role: "volunteer" },
    ];

    getDocs
      .mockResolvedValueOnce(mockSnapshot(mockCases))
      .mockResolvedValueOnce(mockSnapshot(mockUsers))
      .mockResolvedValueOnce(mockSnapshot([]));

    const stats = await getReportsStats();

    expect(stats.totalCases).toBe(4);
    expect(stats.openCases).toBe(1);
    expect(stats.assignedCases).toBe(1);
    expect(stats.closedCases).toBe(2);
  

    expect(stats.admins).toBe(1);
    expect(stats.coordinators).toBe(1);
    expect(stats.volunteers).toBe(3);

    expect(stats.successfulCases).toBe(1);
    expect(stats.successRate).toBe(50);

    expect(stats.cityStats).toEqual([
      { city: "Haifa", count: 2 },
      { city: "Jerusalem", count: 1 },
      { city: "Tel Aviv", count: 1 },
    ]);

    expect(stats.casesList).toHaveLength(4);
    expect(stats.usersList).toHaveLength(5);
  });

  it("returns 0 success rate when there are no closed cases", async () => {
    const mockCases = [
      {
        id: "case-1",
        status: "open",
        urgency: "low",
        city: "Haifa",
      },
    ];

    const mockUsers = [
      {
        id: "user-1",
        role: "volunteer",
        is_available: true,
      },
    ];

    getDocs
      .mockResolvedValueOnce(mockSnapshot(mockCases))
      .mockResolvedValueOnce(mockSnapshot(mockUsers))
      .mockResolvedValueOnce(mockSnapshot([]));

    const stats = await getReportsStats();

    expect(stats.closedCases).toBe(0);
    expect(stats.successfulCases).toBe(0);
    expect(stats.successRate).toBe(0);
  });

  it("groups cases without city under Unknown", async () => {
    const mockCases = [
      {
        id: "case-1",
        status: "open",
        urgency: "low",
        city: "",
      },
      {
        id: "case-2",
        status: "closed",
        urgency: "low",
      },
    ];

    const mockUsers = [];

    getDocs
      .mockResolvedValueOnce(mockSnapshot(mockCases))
      .mockResolvedValueOnce(mockSnapshot(mockUsers))
      .mockResolvedValueOnce(mockSnapshot([]));

    const stats = await getReportsStats();

    expect(stats.cityStats).toEqual([{ city: "Unknown", count: 2 }]);
  });
});