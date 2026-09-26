const ApiResponse = require("../utils/ApiResponse");
const { Promotion } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getPromotions = asyncHandler(async (req, res) => {
	const promotions = await Promotion.find({ isActive: true }).sort({ discountPercent: -1 });
	res.status(200).json(new ApiResponse(200, "Promotions fetched successfully", promotions));
});

const createPromotion = asyncHandler(async (req, res) => {
	const { title, code, discountPercent, validFrom, validTo, description, spaceId } = req.body;
	const promo = await Promotion.create({
		ownerId: req.user?.id,
		spaceId: spaceId || null,
		title,
		code: String(code).toUpperCase(),
		discountPercent: Number(discountPercent) || 10,
		validFrom,
		validTo,
		description,
		isActive: true,
	});
	res.status(201).json(new ApiResponse(201, "Promotion created successfully", promo));
});

module.exports = {
	getPromotions,
	createPromotion,
};
