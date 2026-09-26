const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 80,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
			default: "",
		},
		password: {
			type: String,
			required: true,
			default: "",
		},
		phone: {
			type: String,
			required: true,
			default: "",
			maxlength: 20,
		},
		roleDescription: {
			type: String,
			default: "",
			maxlength: 120,
		},
		role: {
			type: String,
			required: true,
			enum: ["admin", "faculty", "student", "coordinator", "owner", "customer"],
			default: "customer",
		},
		status: {
			type: String,
			required: true,
			default: "active",
			enum: ["active", "suspended"],
		},
		organizationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organization",
			default: null,
		},
		savedVenues: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Space",
			},
		],
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

module.exports = mongoose.model("User", userSchema);
