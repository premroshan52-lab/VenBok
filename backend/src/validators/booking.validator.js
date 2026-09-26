const BOOKING_TYPES = [
	"Seminar",
	"Club",
	"Workshop",
	"Hackathon",
	"Training",
	"Conference",
	"Wedding",
	"Exhibition",
	"Corporate",
	"Cultural",
	"Sports",
	"Meeting",
];
const BOOKING_STATUSES = [
	"Draft",
	"Requested",
	"Pending",
	"Approved",
	"Confirmed",
	"In Progress",
	"Completed",
	"Cancelled",
	"Rejected",
];

const asString = (value) => (typeof value === "string" ? value.trim() : "");
const asNumber = (value) => (typeof value === "number" ? value : Number(value));

const normalizeRequestedRole = (value) => {
	const raw = asString(value).toLowerCase();

	if (!raw) return "";
	if (raw === "admin" || raw === "event organizer") return "admin";
	if (raw === "faculty") return "faculty";
	if (raw === "owner") return "owner";
	if (raw === "customer") return "customer";
	if (raw === "student" || raw === "coordinator" || raw === "student coordinator" || raw === "event coordinator") {
		return "student";
	}

	return raw;
};

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const validateCreateBooking = (payload = {}) => {
	const errors = [];

	const title = asString(payload.title);
	const type = asString(payload.type);
	const spaceId = asString(payload.spaceId);
	const date = asString(payload.date);
	const start = asString(payload.start);
	const end = asString(payload.end);
	const participants = asNumber(payload.participants);
	const organizedBy = asString(payload.organizedBy);
	const notes = asString(payload.notes);
	const requestedBy = asString(payload.requestedBy);
	const requestedRoleRaw = asString(payload.requestedRole);
	const requestedRole = normalizeRequestedRole(payload.requestedRole);

	if (!title) {
		errors.push("title is required");
	} else if (title.length > 120) {
		errors.push("title must be at most 120 characters long");
	}

	if (!type) {
		errors.push("type is required");
	} else if (!BOOKING_TYPES.includes(type)) {
		errors.push(`type must be one of: ${BOOKING_TYPES.join(", ")}`);
	}

	const mongoose = require("mongoose");
	if (!spaceId) {
		errors.push("spaceId is required");
	} else if (!mongoose.Types.ObjectId.isValid(spaceId)) {
		errors.push("spaceId must be a valid ObjectId");
	}

	if (!isValidDate(date)) {
		errors.push("date must be in YYYY-MM-DD format");
	}

	if (!isValidTime(start)) {
		errors.push("start must be in HH:mm format");
	}

	if (!isValidTime(end)) {
		errors.push("end must be in HH:mm format");
	}

	if (isValidTime(start) && isValidTime(end) && start >= end) {
		errors.push("end time must be later than start time");
	}

	if (!Number.isFinite(participants) || participants <= 0) {
		errors.push("participants must be greater than 0");
	}

	if (organizedBy && organizedBy.length > 100) {
		errors.push("organizedBy must be at most 100 characters long");
	}

	if (notes && notes.length > 1000) {
		errors.push("notes must be at most 1000 characters long");
	}

	if (requestedBy && requestedBy.length > 80) {
		errors.push("requestedBy must be at most 80 characters long");
	}

	if (requestedRoleRaw && !requestedRole) {
		errors.push("requestedRole must be one of: admin, faculty, student");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			title,
			type,
			spaceId,
			date,
			start,
			end,
			participants,
			organizedBy,
			notes,
			requestedBy,
			requestedRole,
			status: "Pending",
		},
	};
};

const validateBookingStatusUpdate = (payload = {}) => {
	const errors = [];

	const status = asString(payload.status);

	if (!status) {
		errors.push("status is required");
	} else if (!BOOKING_STATUSES.includes(status)) {
		errors.push(`status must be one of: ${BOOKING_STATUSES.join(", ")}`);
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: { status },
	};
};

const validateBookingQuery = (query = {}) => {
	const errors = [];

	const spaceId = query.spaceId === undefined ? undefined : asString(query.spaceId);
	const status = query.status === undefined ? undefined : asString(query.status);
	const date = query.date === undefined ? undefined : asString(query.date);

	const mongoose = require("mongoose");
	if (spaceId !== undefined && (!spaceId || !mongoose.Types.ObjectId.isValid(spaceId))) {
		errors.push("spaceId must be a valid ObjectId when provided");
	}

	if (status !== undefined && status && !BOOKING_STATUSES.includes(status)) {
		errors.push(`status must be one of: ${BOOKING_STATUSES.join(", ")}`);
	}

	if (date !== undefined && date && !isValidDate(date)) {
		errors.push("date must be in YYYY-MM-DD format when provided");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			...(spaceId !== undefined ? { spaceId } : {}),
			...(status !== undefined && status ? { status } : {}),
			...(date !== undefined && date ? { date } : {}),
		},
	};
};

module.exports = {
	BOOKING_TYPES,
	BOOKING_STATUSES,
	validateCreateBooking,
	validateBookingStatusUpdate,
	validateBookingQuery,
};
