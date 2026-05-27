import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  createUserProfile,
  addUser,
  getUserById,
  getAllUsers,
  getUsersByRole,
  getActiveUsers,
  getAvailableVolunteers,
  updateUserProfile,
  updateUserAvailability,
  updateLastLogin,
  activateUser,
  deactivateUser,
  deleteUserProfile,
} from "../services/userService";

import { USER_ROLES } from "../services/userSchema";

vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((db, collectionName, id) => ({ db, collectionName, id })),
  collection: vi.fn((db, collectionName) => ({ db, collectionName })),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),

  query: vi.fn((collectionRef, ...conditions) => ({
    collectionRef,
    conditions,
  })),

  where: vi.fn((field, operator, value) => ({
    field,
    operator,
    value,
  })),

  limit: vi.fn((value) => ({
    type: "limit",
    value,
  })),

  startAfter: vi.fn((doc) => ({
    type: "startAfter",
    doc,
  })),

  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}));

import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setDoc.mockResolvedValue(undefined);
    updateDoc.mockResolvedValue(undefined);
    getDoc.mockResolvedValue(undefined);
    getDocs.mockResolvedValue({ docs: [] });
  });

  describe("createUserProfile", () => {
    it("creates a valid user profile in Firestore", async () => {
      const result = await createUserProfile("uid123", {
        full_name: "Test User",
        email: "TEST@MAIL.COM",
        role: USER_ROLES.VOLUNTEER,
      });

      expect(doc).toHaveBeenCalledWith({}, "users", "uid123");
      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result.uid).toBe("uid123");
      expect(result.email).toBe("test@mail.com");
      expect(result.role).toBe(USER_ROLES.VOLUNTEER);
    });

    it("throws error when uid is missing", async () => {
      await expect(
        createUserProfile("", {
          full_name: "Test User",
          email: "test@mail.com",
          role: USER_ROLES.VOLUNTEER,
        })
      ).rejects.toThrow("Create user profile failed. Please try again.");
    });

    it("throws error when validation fails", async () => {
      await expect(
        createUserProfile("uid123", {
          full_name: "",
          email: "",
          role: "invalid-role",
        })
      ).rejects.toThrow("Create user profile failed. Please try again.");

      expect(setDoc).not.toHaveBeenCalled();
    });

    it("throws friendly error when Firestore setDoc fails", async () => {
      setDoc.mockRejectedValueOnce(new Error("Firestore create error"));

      await expect(
        createUserProfile("uid123", {
          full_name: "Test User",
          email: "test@mail.com",
          role: USER_ROLES.VOLUNTEER,
        })
      ).rejects.toThrow("Create user profile failed. Please try again.");
    });

    it("addUser is an alias for createUserProfile", () => {
      expect(addUser).toBe(createUserProfile);
    });
  });

  describe("getUserById", () => {
    it("returns user data when document exists", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: "uid123",
        data: () => ({
          full_name: "Test User",
          email: "test@mail.com",
          role: USER_ROLES.ADMIN,
        }),
      });

      const user = await getUserById("uid123");

      expect(doc).toHaveBeenCalledWith({}, "users", "uid123");
      expect(user).toEqual({
        uid: "uid123",
        full_name: "Test User",
        email: "test@mail.com",
        role: USER_ROLES.ADMIN,
      });
    });

    it("returns null when document does not exist", async () => {
      getDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const user = await getUserById("uid404");

      expect(user).toBe(null);
    });

    it("throws error when uid is missing", async () => {
      await expect(getUserById("")).rejects.toThrow(
        "Fetch user failed. Please try again."
      );
    });

    it("throws friendly error when Firestore getDoc fails", async () => {
      getDoc.mockRejectedValueOnce(new Error("Firestore network error"));

      await expect(getUserById("uid123")).rejects.toThrow(
        "Fetch user failed. Please try again."
      );
    });
  });

  describe("getAllUsers", () => {
    it("returns paginated users", async () => {
      const lastDoc = { id: "lastDoc" };

      getDocs.mockResolvedValueOnce({
        docs: [
          { id: "uid1", data: () => ({ full_name: "User One" }) },
          { id: "uid2", data: () => ({ full_name: "User Two" }) },
        ],
      });

      const result = await getAllUsers(20, lastDoc);

      expect(collection).toHaveBeenCalledWith({}, "users");
      expect(startAfter).toHaveBeenCalledWith(lastDoc);
      expect(limit).toHaveBeenCalledWith(20);
      expect(query).toHaveBeenCalled();

      expect(result.users).toEqual([
        { uid: "uid1", full_name: "User One" },
        { uid: "uid2", full_name: "User Two" },
      ]);

      expect(result.lastDoc.id).toBe("uid2");
    });

    it("fetches first page when no lastDoc is provided", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      await getAllUsers();

      expect(startAfter).not.toHaveBeenCalled();
      expect(limit).toHaveBeenCalledWith(20);
    });

    it("returns empty list when no users exist", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const result = await getAllUsers();

      expect(result.users).toEqual([]);
      expect(result.lastDoc).toBe(null);
    });

    it("uses default page size when no page size is provided", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      await getAllUsers();

      expect(limit).toHaveBeenCalledWith(20);
    });

    it("throws friendly error when Firestore getDocs fails", async () => {
      getDocs.mockRejectedValueOnce(new Error("Firestore query error"));

      await expect(getAllUsers()).rejects.toThrow(
        "Fetch users failed. Please try again."
      );
    });
  });

  describe("getUsersByRole", () => {
    it("returns users by valid role", async () => {
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "uid1",
            data: () => ({
              full_name: "Coordinator User",
              role: USER_ROLES.COORDINATOR,
            }),
          },
        ],
      });

      const users = await getUsersByRole(USER_ROLES.COORDINATOR);

      expect(where).toHaveBeenCalledWith(
        "role",
        "==",
        USER_ROLES.COORDINATOR
      );

      expect(users).toEqual([
        {
          uid: "uid1",
          full_name: "Coordinator User",
          role: USER_ROLES.COORDINATOR,
        },
      ]);
    });

    it("throws error for invalid role", async () => {
      await expect(getUsersByRole("superadmin")).rejects.toThrow(
        "Fetch users by role failed. Please try again."
      );

      expect(getDocs).not.toHaveBeenCalled();
    });

    it("returns empty array when no users match role", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const users = await getUsersByRole(USER_ROLES.ADMIN);

      expect(users).toEqual([]);
    });

    it("throws friendly error when Firestore getDocs fails", async () => {
      getDocs.mockRejectedValueOnce(new Error("Firestore error"));

      await expect(getUsersByRole(USER_ROLES.VOLUNTEER)).rejects.toThrow(
        "Fetch users by role failed. Please try again."
      );
    });
  });

  describe("getActiveUsers", () => {
    it("returns only active users", async () => {
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "uid1",
            data: () => ({
              full_name: "Active User",
              is_active: true,
            }),
          },
        ],
      });

      const users = await getActiveUsers();

      expect(where).toHaveBeenCalledWith("is_active", "==", true);
      expect(users).toEqual([
        {
          uid: "uid1",
          full_name: "Active User",
          is_active: true,
        },
      ]);
    });

    it("returns empty array when no active users exist", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const users = await getActiveUsers();

      expect(users).toEqual([]);
    });
  });

  describe("getAvailableVolunteers", () => {
    it("returns active and available volunteers", async () => {
      getDocs.mockResolvedValueOnce({
        docs: [
          {
            id: "uid1",
            data: () => ({
              full_name: "Volunteer User",
              role: USER_ROLES.VOLUNTEER,
              is_active: true,
              is_available: true,
            }),
          },
        ],
      });

      const users = await getAvailableVolunteers();

      expect(where).toHaveBeenCalledWith(
        "role",
        "==",
        USER_ROLES.VOLUNTEER
      );
      expect(where).toHaveBeenCalledWith("is_active", "==", true);
      expect(where).toHaveBeenCalledWith("is_available", "==", true);

      expect(users).toEqual([
        {
          uid: "uid1",
          full_name: "Volunteer User",
          role: USER_ROLES.VOLUNTEER,
          is_active: true,
          is_available: true,
        },
      ]);
    });

    it("returns empty array when no available volunteers exist", async () => {
      getDocs.mockResolvedValueOnce({ docs: [] });

      const users = await getAvailableVolunteers();

      expect(users).toEqual([]);
    });
  });

  describe("updateUserProfile", () => {
    it("updates allowed fields and adds updated_at", async () => {
      const result = await updateUserProfile("uid123", {
        full_name: "Updated User",
        city: "Jerusalem",
      });

      expect(doc).toHaveBeenCalledWith({}, "users", "uid123");
      expect(updateDoc).toHaveBeenCalledWith(
        {
          db: {},
          collectionName: "users",
          id: "uid123",
        },
        {
          full_name: "Updated User",
          city: "Jerusalem",
          updated_at: "SERVER_TIMESTAMP",
        }
      );

      expect(result).toBe(true);
    });

    it("updates only provided fields", async () => {
      await updateUserProfile("uid123", {
        city: "Jerusalem",
      });

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        city: "Jerusalem",
        updated_at: "SERVER_TIMESTAMP",
      });
    });

    it("removes protected fields before update", async () => {
      await updateUserProfile("uid123", {
        email: "hacker@mail.com",
        role: USER_ROLES.ADMIN,
        created_at: "fake-date",
        stats: { total_rescues: 999 },
        rating_stats: { average: 5, count: 99 },
        full_name: "Safe Update",
      });

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        full_name: "Safe Update",
        updated_at: "SERVER_TIMESTAMP",
      });
    });

    it("throws error when only protected fields are provided", async () => {
      await expect(
        updateUserProfile("uid123", {
          email: "blocked@mail.com",
          role: USER_ROLES.ADMIN,
        })
      ).rejects.toThrow("Update user profile failed. Please try again.");

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("throws error when uid is missing", async () => {
      await expect(
        updateUserProfile("", { full_name: "Updated User" })
      ).rejects.toThrow("Update user profile failed. Please try again.");
    });

    it("uses serverTimestamp for updates", async () => {
      await updateUserProfile("uid123", {
        city: "Jerusalem",
      });

      expect(serverTimestamp).toHaveBeenCalled();
    });

    it("throws friendly error when Firestore updateDoc fails", async () => {
      updateDoc.mockRejectedValueOnce(new Error("Firestore update error"));

      await expect(
        updateUserProfile("uid123", {
          full_name: "Updated User",
        })
      ).rejects.toThrow("Update user profile failed. Please try again.");
    });
  });

  describe("updateUserAvailability", () => {
    it("updates user availability to false", async () => {
      const result = await updateUserAvailability("uid123", false);

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_available: false,
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });

    it("updates user availability to true", async () => {
      const result = await updateUserAvailability("uid123", true);

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_available: true,
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });

    it("converts truthy availability value to boolean", async () => {
      await updateUserAvailability("uid123", "yes");

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_available: true,
        updated_at: "SERVER_TIMESTAMP",
      });
    });

    it("converts falsy availability value to boolean", async () => {
      await updateUserAvailability("uid123", 0);

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_available: false,
        updated_at: "SERVER_TIMESTAMP",
      });
    });
  });

  describe("updateLastLogin", () => {
    it("updates last login timestamp", async () => {
      const result = await updateLastLogin("uid123");

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        last_login_at: "SERVER_TIMESTAMP",
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });

    it("throws error when uid is missing", async () => {
      await expect(updateLastLogin("")).rejects.toThrow(
        "Update last login failed. Please try again."
      );
    });
  });

  describe("activateUser", () => {
    it("activates user and clears deleted_at", async () => {
      const result = await activateUser("uid123");

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_active: true,
        deleted_at: null,
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });
  });

  describe("deactivateUser", () => {
    it("deactivates user", async () => {
      const result = await deactivateUser("uid123");

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_active: false,
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });
  });

  describe("deleteUserProfile", () => {
    it("soft deletes user profile", async () => {
      const result = await deleteUserProfile("uid123");

      expect(updateDoc).toHaveBeenCalledWith(expect.any(Object), {
        is_active: false,
        is_available: false,
        deleted_at: "SERVER_TIMESTAMP",
        updated_at: "SERVER_TIMESTAMP",
      });

      expect(result).toBe(true);
    });

    it("throws error when uid is missing", async () => {
      await expect(deleteUserProfile("")).rejects.toThrow(
        "Delete user profile failed. Please try again."
      );

      expect(updateDoc).not.toHaveBeenCalled();
    });

    it("throws friendly error when Firestore updateDoc fails on delete", async () => {
      updateDoc.mockRejectedValueOnce(new Error("Firestore error"));

      await expect(deleteUserProfile("uid123")).rejects.toThrow(
        "Delete user profile failed. Please try again."
      );
    });
  });

  describe("concurrency-like behavior", () => {
    it("handles multiple availability updates", async () => {
      const updates = [];

      for (let i = 0; i < 10; i++) {
        updates.push(updateUserAvailability(`uid${i}`, true));
      }

      await Promise.all(updates);

      expect(updateDoc).toHaveBeenCalledTimes(10);
    });
  });
});