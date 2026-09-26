const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		spaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Space",
			required: true,
		},
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
			default: null,
		},
		subject: {
			type: String,
			required: true,
			maxlength: 120,
		},
		category: {
			type: String,
			enum: ["Venue Facility Issue", "Booking Conflict", "Cleanliness & Safety", "False Listing", "Administrative / Policy Dispute", "Other"],
			default: "Venue Facility Issue",
		},
		description: {
			type: String,
			required: true,
			maxlength: 1000,
		},
		status: {
			type: String,
			enum: ["Open", "Under Review", "Responded", "Resolved", "Closed"],
			default: "Open",
		},
		ownerResponse: {
			type: String,
			default: "",
		},
		adminNotes: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
		toJSON: {
			virtuals: true,
			transform: (doc, ret) => {
				ret.id = ret._id ? ret._id.toString() : ret.id;
				delete ret._id;
				delete ret.__v;
				return ret;
			},
		},
	}
);

complaintSchema.index({ status: 1 });
complaintSchema.index({ spaceId: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
