const USER_ROLES = ["admin", "faculty", "student", "coordinator", "owner", "customer"];

const asString = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeUserRole = (value) => {
	const role = asString(value).toLowerCase();

	if (!role) return "";
	if (role === "student coordinator") return "coordinator";
	return role;
};

const normalizePhone = (value) => {
	const phone = asString(value).replace(/\s+/g, "");
	return phone;
};

const validateLogin = (payload = {}) => {
	const errors = [];

	const email = asString(payload.email).toLowerCase();
	const password = typeof payload.password === "string" ? payload.password : "";

	if (!email) {
		errors.push("email is required");
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		errors.push("email must be a valid email address");
	}

	if (!password) {
		errors.push("password is required");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			email,
			password,
		},
	};
};

const validateRegister = (payload = {}) => {
	const errors = [];

	const name = asString(payload.name);
	const email = asString(payload.email).toLowerCase();
	const password = typeof payload.password === "string" ? payload.password : "";
	const role = normalizeUserRole(payload.role);
	const phone = normalizePhone(payload.phone);
	const roleDescription = asString(payload.roleDescription);

	if (!name) {
		errors.push("name is required");
	} else if (name.length > 80) {
		errors.push("name must be at most 80 characters long");
	}

	if (!email) {
		errors.push("email is required");
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		errors.push("email must be a valid email address");
	} else if (["faculty", "student"].includes(role) && !email.endsWith("@sece.ac.in") && !email.includes("demo.venbok.local")) {
		errors.push("institutional faculty/student email must end with @sece.ac.in");
	}

	if (!password) {
		errors.push("password is required");
	} else if (password.length < 8) {
		errors.push("password must be at least 8 characters long");
	}

	if (role && !USER_ROLES.includes(role)) {
		errors.push(`role must be one of: ${USER_ROLES.join(", ")}`);
	}

	if (!phone) {
		errors.push("phone is required");
	} else if (!/^\+?[0-9]{10,15}$/.test(phone)) {
		errors.push("phone must be 10 to 15 digits and may start with +");
	}

	if (roleDescription.length > 120) {
		errors.push("roleDescription must be at most 120 characters long");
	}

	return {
		isValid: errors.length === 0,
		errors,
		value: {
			name,
			email,
			password,
			role: role || "faculty",
			phone,
			roleDescription,
		},
	};
};

module.exports = {
	USER_ROLES,
	validateLogin,
	validateRegister,
};
