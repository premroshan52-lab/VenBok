const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
	{
		bookingId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Booking",
			required: true,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		currency: {
			type: String,
			default: "INR",
		},
		transactionId: {
			type: String,
			required: true,
			unique: true,
		},
		paymentMethod: {
			type: String,
			enum: ["UPI", "CreditCard", "DebitCard", "NetBanking", "CorporateWallet", "InstitutionalGrant"],
			default: "UPI",
		},
		status: {
			type: String,
			enum: ["Pending", "Completed", "Failed", "Refunded"],
			default: "Completed",
		},
		receiptUrl: {
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

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
