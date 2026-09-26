const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { Space, Booking } = require("../models");
const intelligenceService = require("../services/intelligence.service");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const parseQuery = asyncHandler(async (req, res) => {
	const { query } = req.body;
	const result = intelligenceService.parseNaturalQuery(query);
	res.status(200).json(new ApiResponse(200, "Natural query parsed successfully", result));
});

const getRecommendations = asyncHandler(async (req, res) => {
	const criteria = req.body || {};
	const spaces = await Space.find({ status: "active" });

	const scored = spaces.map((space) => {
		const plain = space.toObject ? space.toObject() : space;
		const match = intelligenceService.calculateRecommendationScore(plain, criteria);
		return {
			...plain,
			match,
		};
	});

	// Sort by overall match score descending
	scored.sort((a, b) => b.match.overallScore - a.match.overallScore);

	res.status(200).json(new ApiResponse(200, "Recommendations generated successfully", scored));
});

const getEventPlan = asyncHandler(async (req, res) => {
	const { eventType, participants } = req.query;
	const plan = intelligenceService.getEventPlan(eventType, participants);
	res.status(200).json(new ApiResponse(200, "Event requirements generated successfully", plan));
});

const getCostEstimate = asyncHandler(async (req, res) => {
	const { spaceId, ...options } = req.body;
	const space = spaceId ? await Space.findById(spaceId) : null;
	const estimate = intelligenceService.estimateEventCost(space, options);
	res.status(200).json(new ApiResponse(200, "Event logistics and resource requirements computed successfully", estimate));
});

const getUtilizationAnalytics = asyncHandler(async (req, res) => {
	const { spaceId } = req.query;
	const analytics = await intelligenceService.calculateUtilizationAnalytics(spaceId);
	res.status(200).json(new ApiResponse(200, "Utilization analytics fetched successfully", analytics));
});

const getAlternativeVenues = asyncHandler(async (req, res) => {
	const { spaceId } = req.params;
	const { date, start, end, capacity } = req.query;

	const targetSpace = await Space.findById(spaceId);
	if (!targetSpace) {
		throw ApiError.notFound("Requested space not found");
	}

	// Find available alternative spaces that are not the target space
	const alternatives = await Space.find({
		_id: { $ne: spaceId },
		status: "active",
	});

	// Check bookings on date if provided to ensure alternatives are genuinely free
	let busySpaceIds = new Set();
	if (date && start && end) {
		const conflicts = await Booking.find({
			date,
			status: { $in: ["Approved", "Pending", "Confirmed"] },
			start: { $lt: end },
			end: { $gt: start },
		});
		conflicts.forEach((c) => busySpaceIds.add(String(c.spaceId)));
	}

	const candidates = alternatives
		.filter((s) => !busySpaceIds.has(String(s._id)))
		.map((s) => {
			const plain = s.toObject ? s.toObject() : s;
			const match = intelligenceService.calculateRecommendationScore(plain, {
				capacity: capacity || targetSpace.capacity,
				facilities: targetSpace.facilities,
			});
			return {
				...plain,
				match,
				comparisonWithRequested: {
					capacityDiff: s.capacity - targetSpace.capacity,
					sharedFacilities: (s.facilities || []).filter((f) => (targetSpace.facilities || []).includes(f)),
					accessPolicy: "Free Institutional Access",
				},
			};
		})
		.sort((a, b) => b.match.overallScore - a.match.overallScore)
		.slice(0, 4);

	res.status(200).json(
		new ApiResponse(200, "Alternative available venues retrieved successfully", {
			requestedVenue: targetSpace,
			alternatives: candidates,
		})
	);
});

const checkEventFeasibility = asyncHandler(async (req, res) => {
	const { spaceId, ...eventDetails } = req.body;
	if (!spaceId) {
		throw ApiError.badRequest("spaceId is required for event feasibility analysis");
	}
	const feasibility = await intelligenceService.calculateEventFeasibility(spaceId, eventDetails);
	res.status(200).json(new ApiResponse(200, "Event feasibility evaluated successfully", feasibility));
});

module.exports = {
	parseQuery,
	getRecommendations,
	getEventPlan,
	getCostEstimate,
	getUtilizationAnalytics,
	getAlternativeVenues,
	checkEventFeasibility,
};

