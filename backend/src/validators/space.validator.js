const asString = (value) => (typeof value === "string" ? value.trim() : "");
const asNumber = (value) => (typeof value === "number" ? value : Number(value));
const IMAGE_DATA_URL_REGEX = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/;

const isValidImageUrl = (value) => {
	if (!value) {
		return true;
	}

	if (IMAGE_DATA_URL_REGEX.test(value)) {
		return true;
	}

	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
};

const validateCreateSpace = (payload = {}) => {
	const errors = [];

	const name = asString(payload.name);
	const type = asString(payload.type);
	const rawCapacity = payload.capacity;
	const capacity =
		rawCapacity === null || rawCapacity === undefined || rawCapacity === ""
			? null
			: asNumber(rawCapacity);
	const imageUrl = asString(payload.imageUrl);
	const imageSource = payload.imageSource ? asString(payload.imageSource) : null;
	const sourceUrl = payload.sourceUrl ? asString(payload.sourceUrl) : null;
	const sourceName = payload.sourceName ? asString(payload.sourceName) : null;
	const isVerified = payload.isVerified !== undefined ? Boolean(payload.isVerified) : false;
	const isDemo = payload.isDemo !== undefined ? Boolean(payload.isDemo) : !isVerified;

	if (!name) {
		errors.push("name is required");
	} else if (name.length > 100) {
		errors.push("name must be at most 100 characters long");
	}

	if (!type) {
		errors.push("type is required");
	} else if (type.length > 60) {
		errors.push("type must be at most 60 characters long");
	}

	if (capacity !== null) {
		if (!Number.isInteger(capacity) || capacity <= 0) {
			errors.push("capacity must be a positive integer when provided");
		} else if (capacity > 5000) {
			errors.push("capacity must be less than or equal to 5000");
		}
	}

	if (imageUrl && imageUrl.length > 3_000_000) {
		errors.push("imageUrl is too large");
	} else if (imageUrl && !isValidImageUrl(imageUrl)) {
		errors.push("imageUrl must be a valid http(s) URL or image data URL");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			name,
			type,
			capacity,
			imageUrl: imageUrl || null,
			imageSource,
			sourceUrl,
			sourceName,
			isVerified,
			isDemo,
			verificationLevel: payload.verificationLevel || (isVerified ? "Verified" : "Unverified"),
			...(payload.hourlyRate !== undefined ? { hourlyRate: Number(payload.hourlyRate) } : {}),
			...(payload.dailyRate !== undefined ? { dailyRate: Number(payload.dailyRate) } : {}),
			...(payload.city ? { city: asString(payload.city) } : {}),
			...(payload.address ? { address: asString(payload.address) } : {}),
			...(payload.location ? { location: payload.location } : {}),
			...(payload.description ? { description: asString(payload.description) } : {}),
			...(payload.facilities ? { facilities: payload.facilities } : {}),
			...(payload.status ? { status: payload.status } : {}),
			...(payload.organizationId ? { organizationId: payload.organizationId } : {}),
			...(payload.ownerId ? { ownerId: payload.ownerId } : {}),
		},
	};
};

const validateUpdateSpace = (payload = {}) => {
	const mongoose = require("mongoose");
	const errors = [];

	const id = asString(payload.id);
	const createResult = validateCreateSpace(payload);

	if (!id) {
		errors.push("id is required");
	} else if (!mongoose.Types.ObjectId.isValid(id)) {
		errors.push("id must be a valid ObjectId");
	}

	return {
		isValid: errors.length === 0 && createResult.isValid,
		errors: [...errors, ...createResult.errors],
		value: {
			id,
			...createResult.value,
			...(payload.isVerified !== undefined ? { isVerified: Boolean(payload.isVerified) } : {}),
			...(payload.isDemo !== undefined ? { isDemo: Boolean(payload.isDemo) } : {}),
			...(payload.sourceName !== undefined ? { sourceName: payload.sourceName ? asString(payload.sourceName) : null } : {}),
			...(payload.sourceUrl !== undefined ? { sourceUrl: payload.sourceUrl ? asString(payload.sourceUrl) : null } : {}),
			...(payload.imageSource !== undefined ? { imageSource: payload.imageSource ? asString(payload.imageSource) : null } : {}),
			...(payload.verificationLevel ? { verificationLevel: payload.verificationLevel } : {}),
			...(payload.hourlyRate !== undefined ? { hourlyRate: Number(payload.hourlyRate) } : {}),
			...(payload.dailyRate !== undefined ? { dailyRate: Number(payload.dailyRate) } : {}),
			...(payload.city ? { city: asString(payload.city) } : {}),
			...(payload.address ? { address: asString(payload.address) } : {}),
			...(payload.location ? { location: payload.location } : {}),
			...(payload.description ? { description: asString(payload.description) } : {}),
			...(payload.facilities ? { facilities: payload.facilities } : {}),
			...(payload.status ? { status: payload.status } : {}),
		},
	};
};

const validateSpaceQuery = (query = {}) => {
	const errors = [];

	const type = query.type === undefined ? undefined : asString(query.type);
	const minCapacity = query.minCapacity === undefined ? undefined : asNumber(query.minCapacity);
	const maxCapacity = query.maxCapacity === undefined ? undefined : asNumber(query.maxCapacity);

	if (type !== undefined && type.length > 60) {
		errors.push("type must be at most 60 characters long when provided");
	}

	if (minCapacity !== undefined && (!Number.isInteger(minCapacity) || minCapacity < 0)) {
		errors.push("minCapacity must be a non-negative integer when provided");
	}

	if (maxCapacity !== undefined && (!Number.isInteger(maxCapacity) || maxCapacity < 0)) {
		errors.push("maxCapacity must be a non-negative integer when provided");
	}

	if (
		Number.isInteger(minCapacity) &&
		Number.isInteger(maxCapacity) &&
		minCapacity > maxCapacity
	) {
		errors.push("minCapacity cannot be greater than maxCapacity");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			...(type !== undefined && type ? { type } : {}),
			...(minCapacity !== undefined ? { minCapacity } : {}),
			...(maxCapacity !== undefined ? { maxCapacity } : {}),
		},
	};
};

module.exports = {
	validateCreateSpace,
	validateUpdateSpace,
	validateSpaceQuery,
};
