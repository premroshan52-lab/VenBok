const mongoose = require("mongoose");

const spaceSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			minlength: 1,
			maxlength: 100,
		},
		type: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 60,
		},
		capacity: {
			type: Number,
			required: false,
			default: null,
			validate: {
				validator: function (v) {
					return v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 5000);
				},
				message: (props) => `${props.value} is not a valid capacity (must be integer between 1 and 5000, or null)`,
			},
		},
		imageUrl: {
			type: String,
			trim: true,
			default: null,
		},
		imageSource: {
			type: String,
			trim: true,
			default: null,
		},
		sourceUrl: {
			type: String,
			trim: true,
			default: null,
		},
		sourceName: {
			type: String,
			trim: true,
			default: null,
		},
		imageSourceType: {
			type: String,
			enum: ["official", "demo", "unverified"],
			default: "official",
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
		isDemo: {
			type: Boolean,
			default: true,
		},
		photos: {
			type: [String],
			default: [],
		},
		description: {
			type: String,
			default: "Premium venue space equipped with modern audiovisual systems, climate control, and flexible seating layouts.",
		},
		hourlyRate: {
			type: Number,
			default: 2500,
			min: 0,
		},
		dailyRate: {
			type: Number,
			default: 18000,
			min: 0,
		},
		city: {
			type: String,
			default: "Coimbatore",
			trim: true,
		},
		address: {
			type: String,
			default: "Sri Eshwar Campus, Vadasithur Road, Kinathukadavu",
			trim: true,
		},
		location: {
			lat: { type: Number, default: 10.8281 },
			lng: { type: Number, default: 77.0197 },
		},
		facilities: {
			type: [String],
			default: ["Air Conditioning", "Projector", "WiFi", "Sound System", "Power Backup", "Parking"],
		},
		verificationLevel: {
			type: String,
			enum: ["Unverified", "Verified", "Premium Verified"],
			default: "Verified",
		},
		status: {
			type: String,
			enum: ["active", "maintenance", "inactive"],
			default: "active",
		},
		rating: {
			type: Number,
			default: 4.8,
			min: 1,
			max: 5,
		},
		reviewCount: {
			type: Number,
			default: 14,
		},
		rules: {
			type: [String],
			default: ["Advance reservation required", "No open flames", "Maintain noise levels after 10 PM"],
		},
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		organizationId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Organization",
			default: null,
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

spaceSchema.index({ city: 1, type: 1 });
spaceSchema.index({ capacity: 1, hourlyRate: 1 });
spaceSchema.index({ "location.lat": 1, "location.lng": 1 });

module.exports = mongoose.model("Space", spaceSchema);
