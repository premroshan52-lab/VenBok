const ApiError = require("../utils/ApiError");
const { Space, Booking } = require("../models");
const {
	validateCreateSpace,
	validateUpdateSpace,
	validateSpaceQuery,
} = require("../validators/space.validator");

// ── Helper ───────────────────────────────────────────────────────────────────
const toPlain = (instance) => {
	if (!instance) return null;
	return instance.toObject ? instance.toObject() : { ...instance };
};

// ── Service methods ──────────────────────────────────────────────────────────
const listSpaces = async (query = {}) => {
	const { isValid, errors, value } = validateSpaceQuery(query);
	if (!isValid) {
		throw ApiError.badRequest("Invalid space query", errors);
	}

	const where = {};

	if (value.type) {
		// Case-insensitive exact match using regex
		where.type = new RegExp(`^${value.type}$`, "i");
	}

	if (value.minCapacity !== undefined || value.maxCapacity !== undefined) {
		where.capacity = {};
		if (value.minCapacity !== undefined) {
			where.capacity.$gte = value.minCapacity;
		}
		if (value.maxCapacity !== undefined) {
			where.capacity.$lte = value.maxCapacity;
		}
	}

	const spaces = await Space.find(where).sort({ isVerified: -1, _id: 1 });
	return spaces.map(toPlain);
};

const getSpaceById = async (spaceId) => {
	const space = await Space.findById(spaceId);

	if (!space) {
		throw ApiError.notFound("Space not found");
	}

	return toPlain(space);
};

const createSpace = async (payload = {}) => {
	const { isValid, errors, value } = validateCreateSpace(payload);
	if (!isValid) {
		throw ApiError.badRequest("Invalid space payload", errors);
	}

	// Case-insensitive duplicate name check
	const duplicate = await Space.findOne({
		name: new RegExp(`^${value.name}$`, "i"),
	});
	if (duplicate) {
		throw ApiError.conflict("Space with the same name already exists");
	}

	const space = await Space.create({ ...value });
	return toPlain(space);
};

const updateSpace = async (payload = {}) => {
	const { isValid, errors, value } = validateUpdateSpace(payload);
	if (!isValid) {
		throw ApiError.badRequest("Invalid update payload", errors);
	}

	const existing = await Space.findById(value.id);
	if (!existing) {
		throw ApiError.notFound("Space not found");
	}

	// Case-insensitive duplicate name check (excluding self)
	const duplicate = await Space.findOne({
		_id: { $ne: value.id },
		name: new RegExp(`^${value.name}$`, "i"),
	});
	if (duplicate) {
		throw ApiError.conflict("Another space with the same name already exists");
	}

	const { id, ...updateFields } = value;
	const updated = await Space.findByIdAndUpdate(
		id,
		updateFields,
		{ new: true }
	);
	return toPlain(updated);
};

const deleteSpace = async (spaceId) => {
	const space = await Space.findById(spaceId);
	if (!space) {
		throw ApiError.notFound("Space not found");
	}

	// Delete all bookings referencing this space (cascade behaviour)
	await Booking.deleteMany({ spaceId: space.id });

	await space.deleteOne();
	return toPlain(space);
};

module.exports = {
	listSpaces,
	getSpaceById,
	createSpace,
	updateSpace,
	deleteSpace,
};
