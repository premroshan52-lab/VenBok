const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			maxlength: 120,
		},
		code: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			uppercase: true,
			maxlength: 20,
		},
		type: {
			type: String,
			required: true,
			enum: ["College", "University", "Enterprise", "VenueChain", "PrivateOwner"],
			default: "College",
		},
		city: {
			type: String,
			required: true,
			default: "Coimbatore",
		},
		address: {
			type: String,
			default: "",
		},
		domain: {
			type: String,
			default: "sece.ac.in",
		},
		isVerified: {
			type: Boolean,
			default: true,
		},
		settings: {
			currency: { type: String, default: "INR" },
			timezone: { type: String, default: "Asia/Kolkata" },
			allowPublicBookings: { type: Boolean, default: true },
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

module.exports = mongoose.model("Organization", organizationSchema);
