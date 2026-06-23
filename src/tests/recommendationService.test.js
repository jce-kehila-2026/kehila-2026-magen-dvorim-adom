import { describe, test, expect } from "vitest";
import { recommendVolunteersForCase } from "../services/recommendationService";

describe("recommendVolunteersForCase", () => {
  test("returns only available volunteers", () => {
    const users = [
      { id: "v1", role: "volunteer", is_available: true },
      { id: "v2", role: "volunteer", is_available: false },
      { id: "c1", role: "coordinator", is_available: true },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v1");
  });

  test("excludes already assigned volunteers", () => {
    const users = [
      { id: "v1", role: "volunteer", is_available: true },
      { id: "v2", role: "volunteer", is_available: true },
    ];

    const result = recommendVolunteersForCase({
      caseItem: {},
      users,
      assignedUserIds: ["v1"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("v2");
  });

  test("sorts volunteers by recommendation score descending", () => {
    const users = [
      {
        id: "low",
        role: "volunteer",
        is_available: true,
        distance_km: 40,
        has_evacuation_experience: false,
        has_breeding_experience: false,
        stats: { total_rescues: 5 },
      },
      {
        id: "high",
        role: "volunteer",
        is_available: true,
        distance_km: 10,
        has_evacuation_experience: true,
        has_training: true,
        licenses: { height_work: true },
        stats: { total_rescues: 0 },
      },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    expect(result[0].id).toBe("high");
    expect(result[1].id).toBe("low");
    expect(result[0].recommendationScore).toBeGreaterThan(
      result[1].recommendationScore
    );
  });

  test("adds recommendation details to each volunteer", () => {
    const users = [
      {
        id: "v1",
        role: "volunteer",
        is_available: true,
        distance_km: 10,
        has_evacuation_experience: true,
        has_training: true,
        licenses: { height_work: true },
        stats: { total_rescues: 0 },
      },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    expect(result[0]).toHaveProperty("recommendationScore");
    expect(result[0]).toHaveProperty("recommendationDetails");

    expect(result[0].recommendationDetails).toEqual({
      distanceScore: 60,
      experienceScore: 60,
      trainingScore: 100,
      heightLicenseScore: 100,
      previousCaseScore: 80,
    });

    expect(result[0].recommendationScore).toBe(74);
  });

  test("handles empty users list", () => {
    const result = recommendVolunteersForCase({ caseItem: {}, users: [] });
    expect(result).toEqual([]);
  });

  test("handles missing optional fields without crashing", () => {
    const users = [{ id: "v1", role: "volunteer" }];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    expect(result).toHaveLength(1);
    expect(result[0].recommendationScore).toBeGreaterThanOrEqual(0);
  });

  test("gives higher distance score to closer volunteers", () => {
    const users = [
      { id: "near", role: "volunteer", is_available: true, distance_km: 10 },
      { id: "far", role: "volunteer", is_available: true, distance_km: 40 },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    const near = result.find((user) => user.id === "near");
    const far = result.find((user) => user.id === "far");

    expect(near.recommendationDetails.distanceScore).toBe(60);
    expect(far.recommendationDetails.distanceScore).toBe(0);
  });

  test("treats volunteers with no previous rescues as higher priority", () => {
    const users = [
      {
        id: "newVolunteer",
        role: "volunteer",
        is_available: true,
        stats: { total_rescues: 0 },
      },
      {
        id: "experiencedVolunteer",
        role: "volunteer",
        is_available: true,
        stats: { total_rescues: 10 },
      },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    const newVolunteer = result.find((user) => user.id === "newVolunteer");
    const experiencedVolunteer = result.find(
      (user) => user.id === "experiencedVolunteer"
    );

    expect(newVolunteer.recommendationDetails.previousCaseScore).toBe(80);
    expect(experiencedVolunteer.recommendationDetails.previousCaseScore).toBe(20);
  });

  test("scores evacuation and breeding experience correctly", () => {
  const users = [
    {
      id: "evacuation",
      role: "volunteer",
      is_available: true,
      has_evacuation_experience: true,
    },
    {
      id: "breeding",
      role: "volunteer",
      is_available: true,
      has_breeding_experience: true,
    },
    {
      id: "none",
      role: "volunteer",
      is_available: true,
    },
  ];

  const result = recommendVolunteersForCase({ caseItem: {}, users });

  const byId = (id) => result.find((user) => user.id === id);

  expect(byId("evacuation").recommendationDetails.experienceScore).toBe(60);
  expect(byId("breeding").recommendationDetails.experienceScore).toBe(40);
  expect(byId("none").recommendationDetails.experienceScore).toBe(0);
});

  test("scores training via has_training or has_guidance", () => {
    const users = [
      { id: "trained", role: "volunteer", is_available: true, has_training: true },
      { id: "guided", role: "volunteer", is_available: true, has_guidance: true },
      { id: "neither", role: "volunteer", is_available: true },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    const byId = (id) => result.find((user) => user.id === id);

    expect(byId("trained").recommendationDetails.trainingScore).toBe(100);
    expect(byId("guided").recommendationDetails.trainingScore).toBe(100);
    expect(byId("neither").recommendationDetails.trainingScore).toBe(0);
  });

  test("scores height license from licenses.height_work", () => {
    const users = [
      { id: "licensed", role: "volunteer", is_available: true, licenses: { height_work: true } },
      { id: "unlicensed", role: "volunteer", is_available: true, licenses: { height_work: false } },
      { id: "missing", role: "volunteer", is_available: true },
    ];

    const result = recommendVolunteersForCase({ caseItem: {}, users });

    const byId = (id) => result.find((user) => user.id === id);

    expect(byId("licensed").recommendationDetails.heightLicenseScore).toBe(100);
    expect(byId("unlicensed").recommendationDetails.heightLicenseScore).toBe(0);
    expect(byId("missing").recommendationDetails.heightLicenseScore).toBe(0);
  });
});