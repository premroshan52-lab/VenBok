const ApiError = require("../utils/ApiError");
const { Booking, Space, TimetableOverride, User } = require("../models");
const {
	validateCreateBooking,
	validateBookingQuery,
	validateBookingStatusUpdate,
} = require("../validators/booking.validator");

// ── Helpers ──────────────────────────────────────────────────────────────────
const hasOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const toPlain = (instance) => {
	if (!instance) return null;
	return instance.toObject ? instance.toObject() : { ...instance };
};

// ── Service methods ──────────────────────────────────────────────────────────
const listBookings = async (query = {}) => {
	const { isValid, errors, value } = validateBookingQuery(query);
	if (!isValid) {
		throw ApiError.badRequest("Invalid booking query", errors);
	}

	const where = {};

	if (value.spaceId !== undefined) {
		where.spaceId = value.spaceId;
	}

	if (value.status) {
		where.status = value.status;
	}

	if (value.date) {
		where.date = value.date;
	}

	const bookings = await Booking.find(where).sort({ _id: -1 });

	const bookingRows = bookings.map(toPlain);
	const requestedNames = Array.from(
		new Set(
			bookingRows
				.map((booking) => (typeof booking.requestedBy === "string" ? booking.requestedBy.trim() : ""))
				.filter(Boolean)
		)
	);

	const users = requestedNames.length
		? await User.find({
			name: { $in: requestedNames },
		}).select("name phone")
		: [];

	const phoneByName = new Map(
		users.map((user) => [
			typeof user.name === "string" ? user.name.trim() : "",
			typeof user.phone === "string" ? user.phone : "",
		])
	);

	return bookingRows.map((booking) => ({
		...booking,
		requestedPhone: phoneByName.get(typeof booking.requestedBy === "string" ? booking.requestedBy.trim() : "") || "",
	}));
};

const getBookingById = async (bookingId) => {
	const booking = await Booking.findById(bookingId);

	if (!booking) {
		throw ApiError.notFound("Booking not found");
	}

	return toPlain(booking);
};

const createBooking = async (payload = {}) => {
	const { isValid, errors, value } = validateCreateBooking(payload);
	if (!isValid) {
		throw ApiError.badRequest("Invalid booking payload", errors);
	}

	const space = await Space.findById(value.spaceId);
	if (!space) {
		throw ApiError.notFound("Space not found");
	}

	if (space.capacity && value.participants > space.capacity) {
		throw ApiError.badRequest("Participant count exceeds selected space capacity");
	}

	// Fetch same-day bookings for this space (excluding Rejected)
	const sameDayBookings = await Booking.find({
		spaceId: value.spaceId,
		date: value.date,
		status: { $ne: "Rejected" },
	});

	const conflict = sameDayBookings.find((booking) =>
		hasOverlap(value.start, value.end, booking.start, booking.end)
	);

	if (conflict) {
		throw ApiError.conflict("Selected time overlaps with an existing booking");
	}

	// Check for academic reserved slots — if overlapping, reject immediately
	const academicOverrides = await TimetableOverride.find({
		spaceId: value.spaceId,
		date: value.date,
		status: "academic",
	});

	const academicConflict = academicOverrides.find((override) =>
		hasOverlap(value.start, value.end, override.start, override.end)
	);

	if (academicConflict) {
		throw ApiError.conflict(
			"Selected time slot is reserved for academic activity and cannot be booked"
		);
	}

	const booking = await Booking.create({ ...value });
	return toPlain(booking);
};

const updateBookingStatus = async (bookingId, payload = {}) => {
	const existing = await Booking.findById(bookingId);
	if (!existing) {
		throw ApiError.notFound("Booking not found");
	}

	const { isValid, errors, value } = validateBookingStatusUpdate(payload);
	if (!isValid) {
		throw ApiError.badRequest("Invalid status payload", errors);
	}

	// Terminal states check: once Completed or Cancelled, it is locked
	if (["Completed", "Cancelled"].includes(existing.status) && value.status !== existing.status) {
		throw ApiError.badRequest("Booking is already finalized and cannot be modified");
	}

	existing.status = value.status;
	if (payload.paymentStatus) existing.paymentStatus = payload.paymentStatus;
	if (payload.transactionId) existing.transactionId = payload.transactionId;
	if (payload.totalAmount !== undefined) existing.totalAmount = payload.totalAmount;
	if (payload.rejectionReason) existing.rejectionReason = payload.rejectionReason;

	await existing.save();
	return toPlain(existing);
};

const deleteBooking = async (bookingId) => {
	const booking = await Booking.findById(bookingId);

	if (!booking) {
		throw ApiError.notFound("Booking not found");
	}

	await booking.deleteOne();
	return toPlain(booking);
};

const getReport = async (query = {}) => {
	const now = new Date();
	const scope = typeof query.scope === "string" ? query.scope.trim().toLowerCase() : "month";
	const year = Number(query.year) || now.getFullYear();
	const month = Number(query.month) || now.getMonth() + 1;

	if (!["month", "year"].includes(scope)) {
		throw ApiError.badRequest("scope must be either 'month' or 'year'");
	}

	if (!Number.isInteger(year) || year < 2000 || year > 9999) {
		throw ApiError.badRequest("year must be a valid 4-digit year");
	}

	if (scope === "month" && (!Number.isInteger(month) || month < 1 || month > 12)) {
		throw ApiError.badRequest("month must be between 1 and 12");
	}

	const fromDate = scope === "month" ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
	const toDate =
		scope === "month"
			? new Date(Date.UTC(year, month, 1))
			: new Date(Date.UTC(year + 1, 0, 1));

	const formatDate = (date) => date.toISOString().slice(0, 10);

	const bookings = await Booking.find({
		date: {
			$gte: formatDate(fromDate),
			$lt: formatDate(toDate),
		},
	}).sort({ date: 1, start: 1 });

	const bookingRows = bookings.map(toPlain);
	const uniqueSpaceIds = Array.from(
		new Set(
			bookingRows
				.map((booking) => (booking.spaceId ? booking.spaceId.toString() : ""))
				.filter(Boolean)
		)
	);
	const spaces = uniqueSpaceIds.length
		? await Space.find({ _id: { $in: uniqueSpaceIds } })
		: [];
	const spaceNameById = new Map(spaces.map((space) => [space.id, space.name]));

	const bookingsWithSpace = bookingRows.map((booking) => ({
		...booking,
		spaceName: spaceNameById.get(booking.spaceId ? booking.spaceId.toString() : "") || "-",
	}));

	const statusTotals = bookingsWithSpace.reduce(
		(acc, booking) => {
			acc.total += 1;
			if (booking.status === "Approved") acc.approved += 1;
			if (booking.status === "Pending") acc.pending += 1;
			if (booking.status === "Rejected") acc.rejected += 1;
			return acc;
		},
		{ total: 0, approved: 0, pending: 0, rejected: 0 }
	);

	return {
		scope,
		year,
		month: scope === "month" ? month : null,
		fromDate: formatDate(fromDate),
		toDate: formatDate(toDate),
		totals: statusTotals,
		bookings: bookingsWithSpace,
	};
};

module.exports = {
	listBookings,
	getBookingById,
	createBooking,
	updateBookingStatus,
	deleteBooking,
	getReport,
};
