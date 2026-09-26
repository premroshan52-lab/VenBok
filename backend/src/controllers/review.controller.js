const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { Review, Space } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getSpaceReviews = asyncHandler(async (req, res) => {
	const { spaceId } = req.params;
	const reviews = await Review.find({ spaceId, status: "Approved" })
		.populate("userId", "name role")
		.sort({ createdAt: -1 });

	res.status(200).json(new ApiResponse(200, "Reviews fetched successfully", reviews));
});

const createReview = asyncHandler(async (req, res) => {
	const { spaceId, rating, categories, comment, bookingId } = req.body;

	const space = await Space.findById(spaceId);
	if (!space) {
		throw ApiError.notFound("Space not found");
	}

	const review = await Review.create({
		spaceId,
		userId: req.user?.id,
		bookingId: bookingId || null,
		rating: Number(rating) || 5,
		categories: categories || { cleanliness: 5, facilities: 5, staff: 5, valueForMoney: 5 },
		comment: String(comment || "").trim(),
		status: "Approved",
	});

	// Recalculate space rating average
	const allApproved = await Review.find({ spaceId, status: "Approved" });
	const avg = allApproved.reduce((acc, r) => acc + r.rating, 0) / (allApproved.length || 1);
	space.rating = Math.round(avg * 10) / 10;
	space.reviewCount = allApproved.length;
	await space.save();

	res.status(201).json(new ApiResponse(201, "Review posted successfully", review));
});

const updateReviewStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;
	const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
	res.status(200).json(new ApiResponse(200, "Review status updated", review));
});

module.exports = {
	getSpaceReviews,
	createReview,
	updateReviewStatus,
};
