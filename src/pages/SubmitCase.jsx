import { useState } from "react";
import { createCase } from "../services/caseService";
import {
  getValidIntakeFormForRequester,
  markIntakeFormSubmitted,
} from "../services/intakeFormService";

// ✅ helper to normalize phone numbers
function normalizePhone(phone) {
  return phone.replace(/\D/g, "");
}

function SubmitCase() {
  const [formData, setFormData] = useState({
    requester_first_name: "",
    requester_last_name: "",
    requester_phone: "",
    email: "",

    city: "",
    street: "",
    house_number: "",
    location_description: "",
    height_from_ground: "",
    floor: "",

    navigation_link: "",
    urgency: "",
    first_seen: "",

    coordinator_phone: "",
    agreeToTerms: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ handle input + checkbox
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ normalize phones
    const requesterPhone = normalizePhone(formData.requester_phone);
    const coordinatorPhone = normalizePhone(formData.coordinator_phone);

    // ✅ required fields
    if (
      !formData.requester_first_name ||
      !formData.requester_last_name ||
      !requesterPhone ||
      !formData.city ||
      !formData.street ||
      !formData.location_description ||
      !formData.height_from_ground ||
      !formData.floor ||
      !formData.urgency ||
      !coordinatorPhone
    ) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // ✅ agreement
    if (!formData.agreeToTerms) {
      setError("You must agree to the terms.");
      setLoading(false);
      return;
    }

    try {
      // ✅ STEP 1 — check intake form
      const intakeForm = await getValidIntakeFormForRequester({
        requester_phone: requesterPhone,
        coordinator_phone: coordinatorPhone,
      });

      if (!intakeForm) {
        setError(
          "No valid request form found. It may not exist, expired, or already used."
        );
        setLoading(false);
        return;
      }

      // ✅ STEP 2 — create case
      const caseId = await createCase({
        requester_first_name: formData.requester_first_name,
        requester_last_name: formData.requester_last_name,
        requester_phone: requesterPhone,

        city: formData.city,
        street: formData.street,
        house_number: formData.house_number,
        location_description: formData.location_description,
        height_from_ground: Number(formData.height_from_ground),
        floor: formData.floor,

        navigation_link: formData.navigation_link.trim() || null,


        urgency: formData.urgency,
        first_seen: formData.first_seen ? formData.first_seen : null,


        coordinator_phone: coordinatorPhone,
      });

      // ✅ STEP 3 — lock intake form
      await markIntakeFormSubmitted(intakeForm.id, caseId);

      alert("✅ Case submitted successfully!");

      // ✅ reset form
      setFormData({
        requester_first_name: "",
        requester_last_name: "",
        requester_phone: "",
        email: "",
        city: "",
        street: "",
        house_number: "",
        location_description: "",
        height_from_ground: "",
        floor: "",
        navigation_link: "",
        urgency: "",
        first_seen: "",
        coordinator_phone: "",
        agreeToTerms: false,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto" }}>
      <h1>Submit Case Request</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <h3>Requester</h3>
        <input name="requester_first_name" placeholder="First name *" onChange={handleChange} />
        <input name="requester_last_name" placeholder="Last name *" onChange={handleChange} />
        <input name="requester_phone" placeholder="Phone *" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />

        <h3>Location</h3>
        <input name="city" placeholder="City *" onChange={handleChange} />
        <input name="street" placeholder="Street *" onChange={handleChange} />
        <input name="house_number" placeholder="House number" onChange={handleChange} />
        <textarea name="location_description" placeholder="Description *" onChange={handleChange} />

        <input type="number" name="height_from_ground" placeholder="Height (m) *" onChange={handleChange} />
        <input name="floor" placeholder="Floor *" onChange={handleChange} />

        <input name="navigation_link" placeholder="Navigation link" onChange={handleChange} />

        <h3>Case</h3>
        <select name="urgency" onChange={handleChange}>
          <option value="">Urgency *</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select name="first_seen" onChange={handleChange}>
          <option value="">First seen</option>
          <option value="1_day">1 day</option>
          <option value="2_days">2 days</option>
          <option value="3_days">3 days</option>
          <option value="4_plus_days">4+ days</option>
        </select>

        <h3>Coordinator</h3>
        <input name="coordinator_phone" placeholder="Coordinator phone *" onChange={handleChange} />

        <label>
          <input type="checkbox" name="agreeToTerms" onChange={handleChange} />
          I agree to the terms *
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Case"}
        </button>
      </form>
    </div>
  );
}

export default SubmitCase;
