import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeCaseLocation } from "../services/geocodingService";

describe("geocodeCaseLocation", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns coordinates for a full valid address", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          lat: "31.7880649",
          lon: "35.1993794",
          display_name: "10, Herzl, Jerusalem, Israel",
        },
      ],
    });

    const result = await geocodeCaseLocation({
      city: "Jerusalem",
      street: "Herzl",
      house_number: "10",
      location_description: "near",
    });

    expect(result).toEqual({
      location_lat: 31.7880649,
      location_lng: 35.1993794,
      location_display_name: "10, Herzl, Jerusalem, Israel",
      location_source: "Herzl, 10, Jerusalem, Israel",
    });
  });

  it("tries fallback addresses when the first address fails", async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            lat: "31.7683",
            lon: "35.2137",
            display_name: "Jerusalem, Israel",
          },
        ],
      });

    const result = await geocodeCaseLocation({
      city: "Jerusalem",
      street: "FakeStreet",
      house_number: "999",
      location_description: "near city center",
    });

    expect(result.location_lat).toBe(31.7683);
    expect(result.location_lng).toBe(35.2137);
  });

  it("returns null when no address can be geocoded", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const result = await geocodeCaseLocation({
      city: "",
      street: "",
      house_number: "",
      location_description: "",
    });

    expect(result).toBeNull();
  });

  it("returns null if the geocoding request fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await geocodeCaseLocation({
      city: "Jerusalem",
      street: "Herzl",
      house_number: "10",
    });

    expect(result).toBeNull();
  });
});