/**
 * Central model registry.
 * All Mongoose models are imported here.
 */
const User = require("./User");
const Space = require("./Space");
const Booking = require("./Booking");
const TimetableOverride = require("./TimetableOverride");
const Organization = require("./Organization");
const Review = require("./Review");
const Payment = require("./Payment");
const Notification = require("./Notification");
const Complaint = require("./Complaint");
const Promotion = require("./Promotion");

module.exports = {
	User,
	Space,
	Venue: Space, // Alias for commercial marketplace naming
	Booking,
	TimetableOverride,
	Organization,
	Review,
	Payment,
	Notification,
	Complaint,
	Promotion,
};
