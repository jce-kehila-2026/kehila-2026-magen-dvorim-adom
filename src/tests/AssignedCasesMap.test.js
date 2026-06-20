import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AssignedCasesMap from "../components/AssignedCasesMap";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }) =>
    React.createElement("div", { "data-testid": "map" }, children),

  TileLayer: () =>
    React.createElement("div", { "data-testid": "tile-layer" }),

  CircleMarker: ({ children, center }) =>
    React.createElement(
      "div",
      {
        "data-testid": "marker",
        "data-center": JSON.stringify(center),
      },
      children
    ),

  Popup: ({ children }) =>
    React.createElement("div", { "data-testid": "popup" }, children),

  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    flyTo: vi.fn(),
  }),
}));

const cases = [
  {
    id: "case1",
    requester_first_name: "Aya",
    requester_last_name: "Diab",
    requester_phone: "0533333333",
    city: "Jerusalem",
    street: "Herzl",
    house_number: "10",
    status: "open",
    urgency: "high",
    location_lat: 31.7880649,
    location_lng: 35.1993794,
  },
  {
    id: "case2",
    requester_first_name: "Dana",
    requester_last_name: "Diab",
    requester_phone: "0533333334",
    city: "Haifa",
    street: "Main",
    house_number: "5",
    status: "assigned",
    urgency: "medium",
    location_lat: 32.794,
    location_lng: 34.9896,
  },
  {
    id: "case3",
    requester_first_name: "Noor",
    requester_last_name: "Ali",
    requester_phone: "0533333335",
    city: "Tel Aviv",
    street: "Dizengoff",
    house_number: "20",
    status: "closed",
    urgency: "low",
    location_lat: "",
    location_lng: "",
  },
];

describe("AssignedCasesMap", () => {
  test("renders map", () => {
    render(
      React.createElement(AssignedCasesMap, {
        cases,
      })
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();
  });

  test("renders only open and assigned cases", () => {
    render(
      React.createElement(AssignedCasesMap, {
        cases,
      })
    );

    expect(screen.getAllByTestId("marker")).toHaveLength(2);

    expect(screen.getByText("Aya Diab")).toBeInTheDocument();
    expect(screen.getByText("Dana Diab")).toBeInTheDocument();

    expect(screen.queryByText("Noor Ali")).not.toBeInTheDocument();
  });

  test("shows requester details inside popup", () => {
    render(
      React.createElement(AssignedCasesMap, {
        cases,
      })
    );

    expect(screen.getByText(/Status:\s*open/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgency:\s*high/i)).toBeInTheDocument();
    expect(screen.getByText(/Phone:\s*0533333333/i)).toBeInTheDocument();
  });

  test("renders empty map when no cases exist", () => {
    render(
      React.createElement(AssignedCasesMap, {
        cases: [],
      })
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
  });

  test("ignores invalid coordinates", () => {
    render(
      React.createElement(AssignedCasesMap, {
        cases: [
          {
            id: "bad1",
            requester_first_name: "Bad",
            requester_last_name: "Case",
            status: "open",
            urgency: "high",
            location_lat: "abc",
            location_lng: "xyz",
          },
        ],
      })
    );

    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
  });
});