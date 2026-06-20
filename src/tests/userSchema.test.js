import { describe, it, expect } from "vitest";

import {
  USER_ROLES,
  EXPERIENCE_LEVELS,
  isValidUserRole,
  isValidExperienceLevel,
  buildUserProfile,
  validateUserProfile,
} from "../services/userSchema";

describe("userSchema", () => {
  // Test allowed user roles
  describe("isValidUserRole", () => {
    it("returns true for valid roles", () => {
      expect(isValidUserRole(USER_ROLES.ADMIN)).toBe(true);
      expect(isValidUserRole(USER_ROLES.COORDINATOR)).toBe(true);
      expect(isValidUserRole(USER_ROLES.VOLUNTEER)).toBe(true);
    });

    it("returns false for invalid roles", () => {
      expect(isValidUserRole("superadmin")).toBe(false);
      expect(isValidUserRole("manager")).toBe(false);
      expect(isValidUserRole("")).toBe(false);
      expect(isValidUserRole(null)).toBe(false);
      expect(isValidUserRole(undefined)).toBe(false);
      expect(isValidUserRole("<script>")).toBe(false);
    });

    // NEW: role names are case-sensitive
    it("is case-sensitive for roles", () => {
      expect(isValidUserRole("Admin")).toBe(false);
      expect(isValidUserRole("ADMIN")).toBe(false);
      expect(isValidUserRole("Volunteer")).toBe(false);
      expect(isValidUserRole("COORDINATOR")).toBe(false);
    });
  });

  // Test allowed volunteer experience levels
  describe("isValidExperienceLevel", () => {
    it("returns true for valid experience levels", () => {
      expect(isValidExperienceLevel(EXPERIENCE_LEVELS.BEGINNER)).toBe(true);
      expect(isValidExperienceLevel(EXPERIENCE_LEVELS.INTERMEDIATE)).toBe(true);
      expect(isValidExperienceLevel(EXPERIENCE_LEVELS.EXPERIENCED)).toBe(true);
    });

    it("returns false for invalid experience levels", () => {
      expect(isValidExperienceLevel("expert")).toBe(false);
      expect(isValidExperienceLevel("advanced")).toBe(false);
      expect(isValidExperienceLevel("")).toBe(false);
      expect(isValidExperienceLevel(null)).toBe(false);
      expect(isValidExperienceLevel(undefined)).toBe(false);
    });
  });

  // Test user profile building and data cleaning
  describe("buildUserProfile", () => {
    it("builds a clean user profile with normalized data", () => {
      const user = buildUserProfile({
        full_name: "  Test User  ",
        email: "  TEST@GMAIL.COM  ",
        phone: "  123456  ",
        occupation: "  Beekeeper  ",
        city: "  Jerusalem  ",
        role: USER_ROLES.COORDINATOR,
        experience_level: EXPERIENCE_LEVELS.INTERMEDIATE,
        is_available: false,
      });

      expect(user.full_name).toBe("Test User");
      expect(user.email).toBe("test@gmail.com");
      expect(user.phone).toBe("123456");
      expect(user.occupation).toBe("Beekeeper");
      expect(user.city).toBe("Jerusalem");
      expect(user.role).toBe(USER_ROLES.COORDINATOR);
      expect(user.experience_level).toBe(EXPERIENCE_LEVELS.INTERMEDIATE);
      expect(user.is_available).toBe(false);
      expect(user.is_active).toBe(true);
    });

    it("handles edge case emails", () => {
      // email with numbers and local domain
      const user1 = buildUserProfile({ email: "user123@test.co.il" });
      expect(user1.email).toBe("user123@test.co.il");

      // email that is only whitespace becomes empty string
      const user2 = buildUserProfile({ email: "     " });
      expect(user2.email).toBe("");

      // uppercase email gets lowercased
      const user3 = buildUserProfile({ email: "USER@MAIL.CO.IL" });
      expect(user3.email).toBe("user@mail.co.il");
    });

    it("uses default values when data is missing or invalid", () => {
      const user = buildUserProfile({
        role: "invalid-role",
        experience_level: "invalid-level",
        stats: {
          total_rescues: -5,
          current_active_cases: -2,
        },
        rating_stats: {
          average: 10,
          count: -3,
        },
      });

      expect(user.role).toBe(USER_ROLES.VOLUNTEER);
      expect(user.experience_level).toBe(EXPERIENCE_LEVELS.BEGINNER);
      expect(user.stats.total_rescues).toBe(0);
      expect(user.stats.current_active_cases).toBe(0);
      expect(user.rating_stats.average).toBe(5);
      expect(user.rating_stats.count).toBe(0);
      expect(user.is_available).toBe(true);
      expect(user.is_active).toBe(true);
    });

    it("handles null and undefined values safely", () => {
      const user = buildUserProfile({
        full_name: null,
        email: undefined,
        phone: null,
        city: undefined,
      });

      expect(user.full_name).toBe("");
      expect(user.email).toBe("");
      expect(user.phone).toBe("");
      expect(user.city).toBe("");
    });

    // NEW: completely empty object should return all defaults
    it("handles completely empty input", () => {
      const user = buildUserProfile({});

      expect(user.full_name).toBe("");
      expect(user.email).toBe("");
      expect(user.phone).toBe("");
      expect(user.city).toBe("");
      expect(user.occupation).toBe("");
      expect(user.role).toBe(USER_ROLES.VOLUNTEER);
      expect(user.experience_level).toBe(EXPERIENCE_LEVELS.BEGINNER);
      expect(user.is_active).toBe(true);
      expect(user.is_available).toBe(true);
    });

    it("does not mutate the original input object", () => {
      const original = {
        full_name: "  Aya  ",
        email: "  AYA@MAIL.COM  ",
      };

      const user = buildUserProfile(original);

      expect(original.full_name).toBe("  Aya  ");
      expect(original.email).toBe("  AYA@MAIL.COM  ");
      expect(user).not.toBe(original);
    });

    it("defaults all equipment and licenses to false when not provided", () => {
      const user = buildUserProfile({});

      expect(user.equipment.protective_suit).toBe(false);
      expect(user.equipment.bee_box).toBe(false);
      expect(user.equipment.ladder).toBe(false);
      expect(user.equipment.smoker).toBe(false);
      expect(user.licenses.height_work).toBe(false);
    });

    it("correctly builds licenses and equipment values", () => {
      const user = buildUserProfile({
        licenses: {
          height_work: true,
        },
        equipment: {
          protective_suit: true,
          bee_box: false,
          ladder: true,
          smoker: true,
        },
      });

      expect(user.licenses.height_work).toBe(true);
      expect(user.equipment.protective_suit).toBe(true);
      expect(user.equipment.bee_box).toBe(false);
      expect(user.equipment.ladder).toBe(true);
      expect(user.equipment.smoker).toBe(true);
    });

    it("converts truthy/falsy values to boolean in equipment", () => {
      const user = buildUserProfile({
        equipment: {
          protective_suit: 1,   // truthy number
          bee_box: 0,           // falsy number
          ladder: "yes",        // truthy string
          smoker: "",           // falsy string
        },
      });

      expect(user.equipment.protective_suit).toBe(true);
      expect(user.equipment.bee_box).toBe(false);
      expect(user.equipment.ladder).toBe(true);
      expect(user.equipment.smoker).toBe(false);
    });

    it("clamps rating average between 0 and 5", () => {
      const highRatingUser = buildUserProfile({
        rating_stats: {
          average: 999,
          count: 3,
        },
      });

      const negativeRatingUser = buildUserProfile({
        rating_stats: {
          average: -10,
          count: 3,
        },
      });

      expect(highRatingUser.rating_stats.average).toBe(5);
      expect(negativeRatingUser.rating_stats.average).toBe(0);
    });

    it("prevents negative stats values", () => {
      const user = buildUserProfile({
        stats: {
          total_rescues: -20,
          current_active_cases: -4,
        },
        rating_stats: {
          count: -8,
        },
      });

      expect(user.stats.total_rescues).toBe(0);
      expect(user.stats.current_active_cases).toBe(0);
      expect(user.rating_stats.count).toBe(0);
    });

    it("builds multiple users safely", () => {
      for (let i = 0; i < 100; i++) {
        const user = buildUserProfile({
          full_name: `User ${i}`,
          email: `USER${i}@MAIL.COM`,
          role: USER_ROLES.VOLUNTEER,
        });

        expect(user.full_name).toBe(`User ${i}`);
        expect(user.email).toBe(`user${i}@mail.com`);
        expect(user.role).toBe(USER_ROLES.VOLUNTEER);
      }
    });
  });

  // Test user profile validation before saving
  describe("validateUserProfile", () => {
    it("validates a correct user profile", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
        role: USER_ROLES.VOLUNTEER,
        phone: "123456789",
        experience_level: EXPERIENCE_LEVELS.BEGINNER,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("returns errors for missing required fields", () => {
      const result = validateUserProfile({
        full_name: "",
        email: "",
        role: USER_ROLES.VOLUNTEER,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.full_name).toBe("Full name is required.");
      expect(result.errors.email).toBe("Email is required.");
    });

    it("returns error when role is missing", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.role).toBe("Invalid user role.");
    });

    // NEW: completely empty object should fail all required fields
    it("returns errors for completely empty input", () => {
      const result = validateUserProfile({});

      expect(result.isValid).toBe(false);
      expect(result.errors.full_name).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.role).toBeDefined();
    });

    it("handles non-string inputs safely", () => {
      const result = validateUserProfile({
        full_name: 12345,   // number instead of string
        email: true,        // boolean instead of string
        role: USER_ROLES.VOLUNTEER,
      });

      expect(result.isValid).toBe(false);
    });

    it("returns error for invalid email", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "wrong-email",
        role: USER_ROLES.VOLUNTEER,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe("Invalid email format.");
    });

    it("returns error for invalid phone", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
        phone: "abc123",
        role: USER_ROLES.VOLUNTEER,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.phone).toBe("Invalid phone number format.");
    });

    it("accepts valid phone formats", () => {
      const validPhones = ["0501234567", "+972 50 123 4567", "02-1234567"];

      validPhones.forEach((phone) => {
        const result = validateUserProfile({
          full_name: "Test User",
          email: "test@gmail.com",
          phone,
          role: USER_ROLES.VOLUNTEER,
        });

        expect(result.isValid).toBe(true);
      });
    });

    it("returns error for invalid role", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
        role: "superadmin",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.role).toBe("Invalid user role.");
    });

    it("returns error for malicious role value", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
        role: "<script>alert('x')</script>",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.role).toBe("Invalid user role.");
    });

    it("returns error for invalid experience level", () => {
      const result = validateUserProfile({
        full_name: "Test User",
        email: "test@gmail.com",
        role: USER_ROLES.VOLUNTEER,
        experience_level: "expert",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.experience_level).toBe(
        "Invalid experience level."
      );
    });
  });
});