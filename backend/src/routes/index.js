const express = require("express");
const authRoutes = require("./auth.routes");
const bookingRoutes = require("./booking.routes");
const spaceRoutes = require("./space.routes");
const userRoutes = require("./user.routes");
const timetableOverrideRoutes = require("./timetable-override.routes");
const intelligenceRoutes = require("./intelligence.routes");
const paymentRoutes = require("./payment.routes");
const notificationRoutes = require("./notification.routes");
const reviewRoutes = require("./review.routes");
const complaintRoutes = require("./complaint.routes");
const promotionRoutes = require("./promotion.routes");
const organizationRoutes = require("./organization.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/spaces", spaceRoutes);
router.use("/users", userRoutes);
router.use("/timetable-overrides", timetableOverrideRoutes);
router.use("/intelligence", intelligenceRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/reviews", reviewRoutes);
router.use("/complaints", complaintRoutes);
router.use("/promotions", promotionRoutes);
router.use("/organizations", organizationRoutes);

module.exports = router;
