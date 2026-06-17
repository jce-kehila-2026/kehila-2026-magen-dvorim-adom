import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    case_complexity: "simple",
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
    case_complexity: "complex",
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
    case_complexity: "very_complex",
    location_lat: "",
    location_lng: "",
  },
];

describe("AssignedCasesMap", () => {
  test("renders map and markers only for cases with coordinates", () => {
    render(React.createElement(AssignedCasesMap, { cases }));

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.getAllByTestId("marker")).toHaveLength(2);

    expect(screen.getByText(/Showing\s+2\s+cases\s+on the map/i)).toBeInTheDocument();
  
  });

  test("shows requester details inside marker popups", () => {
    render(React.createElement(AssignedCasesMap, { cases }));

    expect(screen.getByText("Aya Diab")).toBeInTheDocument();
    expect(screen.getByText("Dana Diab")).toBeInTheDocument();

    expect(screen.getByText(/Status:\s*open/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgency:\s*high/i)).toBeInTheDocument();
  });

  test("filters open cases", () => {
    render(React.createElement(AssignedCasesMap, { cases }));

    fireEvent.click(screen.getByText("Open"));

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    expect(screen.getByText(/Showing\s+1\s+case\s+on the map/i)).toBeInTheDocument();
    expect(screen.getByText("Aya Diab")).toBeInTheDocument();
  });

  test("filters assigned cases", () => {
    render(React.createElement(AssignedCasesMap, { cases }));

    fireEvent.click(screen.getByText("Assigned"));

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    expect(screen.getByText("Dana Diab")).toBeInTheDocument();
    expect(screen.getByText(/Showing\s+1\s+case\s+on the map/i)).toBeInTheDocument();
  });

  test("does not render a closed filter because map supports only all, open, and assigned", () => {
    render(React.createElement(AssignedCasesMap, { cases }));

    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.queryByText("Closed")).not.toBeInTheDocument();
  });

  test("renders default empty state when no cases are provided", () => {
    render(React.createElement(AssignedCasesMap, { cases: [] }));

    expect(screen.getByTestId("map")).toBeInTheDocument();
    expect(screen.queryAllByTestId("marker")).toHaveLength(0);
    expect(screen.getByText(/Showing\s+0\s+cases\s+on the map/i)).toBeInTheDocument();
  });

  test("ignores cases with invalid coordinate values", () => {
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
    expect(screen.getByText(/Showing\s+0\s+cases\s+on the map/i)).toBeInTheDocument();
    expect(screen.getByText(/1 cases need location information/i)).toBeInTheDocument();
  });
});