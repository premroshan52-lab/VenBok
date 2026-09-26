import React, { useEffect, useState } from "react";
import InputField from "../common/InputField";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { getDayAbbrev, isTimeOverlapping } from "../../utils/time";

const BookingForm = ({ spaces, bookings, timetable, onAddBooking }) => {
  const { user, role } = useAuth();
  const [errors, setErrors] = useState([]);
  const [form, setForm] = useState({
    title: "",
    type: "Seminar",
    spaceId: "",
    date: "",
    start: "",
    end: "",
    participants: "",
    organizedBy: "",
    notes: "",
  });

  useEffect(() => {
    if (spaces.length && !form.spaceId) {
      setForm((prev) => ({ ...prev, spaceId: String(spaces[0].id) }));
    }
  }, [spaces, form.spaceId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validateBooking = () => {
    const issues = [];
    const selectedSpace = spaces.find((space) => String(space.id) === form.spaceId);

    if (!form.title.trim()) {
      issues.push("Event title is required.");
    }
    if (!form.date) {
      issues.push("Date is required.");
    }
    if (!form.start || !form.end) {
      issues.push("Start and end time are required.");
    }
    if (!form.participants || Number(form.participants) <= 0) {
      issues.push("Number of participants must be greater than 0.");
    }
    if (!selectedSpace) {
      issues.push("Please select a valid venue.");
    }

    if (selectedSpace && selectedSpace.capacity && Number(form.participants) > selectedSpace.capacity) {
      issues.push("Participant count exceeds the selected space capacity.");
    }

    if (form.start && form.end && form.start >= form.end) {
      issues.push("End time must be later than start time.");
    }

    if (selectedSpace && form.date && form.start && form.end) {
      const overlapWithBookings = bookings.some((booking) => {
        if (booking.spaceId !== form.spaceId || booking.date !== form.date) {
          return false;
        }
        return isTimeOverlapping(form.start, form.end, booking.start, booking.end);
      });

      const day = getDayAbbrev(form.date);
      const overlapWithTimetable = timetable.some((slot) => {
        if (slot.spaceId !== form.spaceId || slot.day !== day) {
          return false;
        }
        return isTimeOverlapping(form.start, form.end, slot.start, slot.end);
      });

      if (overlapWithTimetable) {
        issues.push("Selected time overlaps with academic timetable slots.");
      }
      if (overlapWithBookings) {
        issues.push("Selected time overlaps with an existing booking.");
      }
    }

    return issues;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const issues = validateBooking();
    setErrors(issues);
    if (issues.length) {
      return;
    }

    try {
      const created = await onAddBooking({
        title: form.title,
        type: form.type,
        spaceId: form.spaceId,
        date: form.date,
        start: form.start,
        end: form.end,
        participants: Number(form.participants),
        organizedBy: form.organizedBy,
        notes: form.notes,
        requestedBy: user?.name || "Campus User",
        requestedRole: role,
      });

      if (!created) {
        setErrors(["Unable to save booking. Please try again."]);
        return;
      }

      setForm({
        title: "",
        type: "Seminar",
        spaceId: form.spaceId,
        date: "",
        start: "",
        end: "",
      participants: "",
      organizedBy: "",
      notes: "",
    });
    setErrors([]);
      } catch (error) {
        setErrors([error.message || "Unable to save booking. Please try again."]);
      }
  };

  return (
    <form className="card" style={{ marginBottom: "20px" }} onSubmit={handleSubmit}>
      <h3>Request a Space</h3>
      <div className="form-grid">
        <InputField id="title" label="Event Title" value={form.title} onChange={handleChange("title")} />
        <label className="input-field" htmlFor="type">
          <span>Event Type</span>
          <select id="type" value={form.type} onChange={handleChange("type")}>
            <option>Seminar</option>
            <option>Club</option>
            <option>Workshop</option>
            <option>Hackathon</option>
            <option>Training</option>
          </select>
        </label>
        <label className="input-field" htmlFor="space">
          <span>Select Venue</span>
          <select id="space" value={form.spaceId} onChange={handleChange("spaceId")}>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name} ({space.capacity ? `${space.capacity} Pax` : "Capacity not published"})
              </option>
            ))}
          </select>
        </label>
        <InputField id="date" label="Date" type="date" value={form.date} onChange={handleChange("date")} />
        <InputField id="start" label="Start Time" type="time" value={form.start} onChange={handleChange("start")} />
        <InputField id="end" label="End Time" type="time" value={form.end} onChange={handleChange("end")} />
        <InputField
          id="participants"
          label="Number of Participants"
          type="number"
          min="1"
          value={form.participants}
          onChange={handleChange("participants")}
        />
        <InputField
          id="organizedBy"
          label="Organized By"
          value={form.organizedBy}
          onChange={handleChange("organizedBy")}
        />
      </div>

      <div style={{ marginTop: "16px" }}>
        <label className="input-field" htmlFor="notes">
          <span>Additional Notes</span>
          <textarea id="notes" rows="3" value={form.notes} onChange={handleChange("notes")} />
        </label>
      </div>

      {errors.length ? (
        <div className="alert" role="alert">
          {errors.map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : null}

      <div style={{ marginTop: "16px" }}>
        <Button type="submit">Submit Booking</Button>
      </div>
    </form>
  );
};

export default BookingForm;
