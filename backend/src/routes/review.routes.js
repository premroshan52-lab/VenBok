const express = require("express");
const reviewController = require("../controllers/review.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/space/:spaceId", reviewController.getSpaceReviews);
router.post("/", requireAuth, reviewController.createReview);
router.patch("/:id/status", requireAuth, reviewController.updateReviewStatus);

module.exports = router;
