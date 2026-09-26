const ApiResponse = require("../utils/ApiResponse");
const { Complaint } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getComplaints = asyncHandler(async (req, res) => {
	const query = req.user?.role === "admin" ? {} : { userId: req.user?.id };
	const complaints = await Complaint.find(query)
		.populate("spaceId", "name type")
		.populate("userId", "name email role")
		.sort({ createdAt: -1 });

	res.status(200).json(new ApiResponse(200, "Complaints fetched successfully", complaints));
});

const createComplaint = asyncHandler(async (req, res) => {
	const { spaceId, bookingId, subject, category, description } = req.body;
	const complaint = await Complaint.create({
		userId: req.user?.id,
		spaceId,
		bookingId: bookingId || null,
		subject,
		category: category || "Venue Facility Issue",
		description,
		status: "Open",
	});
	res.status(201).json(new ApiResponse(201, "Complaint ticket created successfully", complaint));
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status, ownerResponse, adminNotes } = req.body;

	const complaint = await Complaint.findById(id);
	if (!complaint) {
		throw ApiError.notFound("Complaint not found");
	}

	if (status) complaint.status = status;
	if (ownerResponse) complaint.ownerResponse = ownerResponse;
	if (adminNotes) complaint.adminNotes = adminNotes;

	await complaint.save();
	res.status(200).json(new ApiResponse(200, "Complaint updated successfully", complaint));
});

module.exports = {
	getComplaints,
	createComplaint,
	updateComplaintStatus,
};
