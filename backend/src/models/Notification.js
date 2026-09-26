const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		title: {
			type: String,
			required: true,
			maxlength: 120,
		},
		message: {
			type: String,
			required: true,
			maxlength: 500,
		},
		type: {
			type: String,
			enum: ["booking", "approval", "rejection", "reminder", "system"],
			default: "booking",
		},
		link: {
			type: String,
			default: "",
		},
		isRead: {
			type: Boolean,
			default: false,
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

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
