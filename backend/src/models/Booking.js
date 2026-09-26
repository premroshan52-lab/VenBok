const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 120,
		},
		type: {
			type: String,
			required: true,
			enum: [
				"Seminar",
				"Club",
				"Workshop",
				"Hackathon",
				"Training",
				"Conference",
				"Wedding",
				"Exhibition",
				"Corporate",
				"Cultural",
				"Sports",
				"Meeting",
			],
			default: "Seminar",
		},
		spaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Space",
			required: true,
		},
		date: {
			type: String,
			required: true,
		},
		start: {
			type: String,
			required: true,
			match: /^([01]\d|2[0-3]):([0-5]\d)$/,
		},
		end: {
			type: String,
			required: true,
			match: /^([01]\d|2[0-3]):([0-5]\d)$/,
		},
		participants: {
			type: Number,
			required: true,
			min: 1,
		},
		organizedBy: {
			type: String,
			default: "",
			maxlength: 100,
		},
		notes: {
			type: String,
			default: "",
		},
		requestedBy: {
			type: String,
			default: "Campus User",
			maxlength: 80,
		},
		requestedRole: {
			type: String,
			default: "",
			enum: ["admin", "faculty", "student", "coordinator", "owner", "customer", ""],
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		status: {
			type: String,
			default: "Pending",
			enum: [
				"Draft",
				"Requested",
				"Pending",
				"Approved",
				"Confirmed",
				"In Progress",
				"Completed",
				"Cancelled",
				"Rejected",
			],
		},
		totalAmount: {
			type: Number,
			default: 0,
			min: 0,
		},
		paymentStatus: {
			type: String,
			enum: ["Unpaid", "Pending", "Paid", "Refunded", "N/A", "Free"],
			default: "N/A",
		},
		transactionId: {
			type: String,
			default: "",
		},
		costBreakdown: {
			venueRental: { type: Number, default: 0 },
			equipment: { type: Number, default: 0 },
			catering: { type: Number, default: 0 },
			decoration: { type: Number, default: 0 },
			platformFee: { type: Number, default: 0 },
			taxes: { type: Number, default: 0 },
		},
		requirements: {
			catering: { type: Boolean, default: false },
			soundSystem: { type: Boolean, default: false },
			stageSetup: { type: Boolean, default: false },
			liveStreaming: { type: Boolean, default: false },
			powerBackup: { type: Boolean, default: false },
			security: { type: Boolean, default: false },
		},
		rejectionReason: {
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
		toObject: {
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

bookingSchema.index({ spaceId: 1, date: 1, start: 1, end: 1 });
bookingSchema.index({ spaceId: 1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model("Booking", bookingSchema);
