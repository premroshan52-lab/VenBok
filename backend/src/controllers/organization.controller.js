const ApiResponse = require("../utils/ApiResponse");
const { Organization, Space } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getOrganizations = asyncHandler(async (req, res) => {
	const orgs = await Organization.find({}).sort({ name: 1 });
	res.status(200).json(new ApiResponse(200, "Organizations fetched successfully", orgs));
});

const getOrganizationSpaces = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const spaces = await Space.find({ organizationId: id });
	res.status(200).json(new ApiResponse(200, "Organization spaces fetched successfully", spaces));
});

module.exports = {
	getOrganizations,
	getOrganizationSpaces,
};
