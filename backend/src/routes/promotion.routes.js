const express = require("express");
const promotionController = require("../controllers/promotion.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/", promotionController.getPromotions);
router.post("/", requireAuth, promotionController.createPromotion);

module.exports = router;
