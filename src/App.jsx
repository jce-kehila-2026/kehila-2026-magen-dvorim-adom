import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import SubmitCase from "./pages/SubmitCase";
import Login from "./pages/Login";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/submit-case" element={<SubmitCase />} />
        <Route path="/login" element={<Login />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
        <Route path="/coordinator" element={<CoordinatorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}