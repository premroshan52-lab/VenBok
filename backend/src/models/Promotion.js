const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
	{
		spaceId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Space",
			default: null,
		},
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			required: true,
			maxlength: 100,
		},
		code: {
			type: String,
			required: true,
			uppercase: true,
			trim: true,
		},
		discountPercent: {
			type: Number,
			required: true,
			min: 1,
			max: 90,
		},
		validFrom: {
			type: String,
			required: true,
		},
		validTo: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			default: "",
		},
		isActive: {
			type: Boolean,
			default: true,
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

promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });

module.exports = mongoose.model("Promotion", promotionSchema);
