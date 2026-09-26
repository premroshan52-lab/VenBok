const express = require("express");
const intelligenceController = require("../controllers/intelligence.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// Allow public/customer discovery without requiring login first
router.post("/parse-query", intelligenceController.parseQuery);
router.post("/recommend", intelligenceController.getRecommendations);
router.get("/event-plan", intelligenceController.getEventPlan);
router.post("/cost-estimate", intelligenceController.getCostEstimate);
router.post("/logistics-estimate", intelligenceController.getCostEstimate);
router.post("/feasibility", intelligenceController.checkEventFeasibility);
router.get("/alternatives/:spaceId", intelligenceController.getAlternativeVenues);

// Owner / Admin / Protected analytics
router.get("/utilization", requireAuth, intelligenceController.getUtilizationAnalytics);

module.exports = router;
