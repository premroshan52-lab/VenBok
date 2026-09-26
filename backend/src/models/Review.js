const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
	{
		spaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Space",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
			default: null,
		},
		rating: {
			type: Number,
			required: true,
			min: 1,
			max: 5,
		},
		categories: {
			cleanliness: { type: Number, min: 1, max: 5, default: 5 },
			facilities: { type: Number, min: 1, max: 5, default: 5 },
			staff: { type: Number, min: 1, max: 5, default: 5 },
			valueForMoney: { type: Number, min: 1, max: 5, default: 5 },
		},
		comment: {
			type: String,
			required: true,
			maxlength: 1000,
		},
		status: {
			type: String,
			enum: ["Approved", "Flagged", "Under Review"],
			default: "Approved",
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

reviewSchema.index({ spaceId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
