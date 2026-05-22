import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../pages/Login";

test("renders login page correctly", () => {
  render(<Login />);

  expect(
    screen.getByText("Welcome Back")
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "Login" })
  ).toBeInTheDocument();
});