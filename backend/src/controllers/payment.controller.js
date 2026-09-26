const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { Payment, Booking, Notification } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const checkout = asyncHandler(async (req, res) => {
	const { bookingId, amount, paymentMethod } = req.body;

	const booking = await Booking.findById(bookingId);
	if (!booking) {
		throw ApiError.notFound("Booking not found");
	}

	const txId = "TXN-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
	const payment = await Payment.create({
		bookingId: booking._id,
		userId: req.user?.id || booking.userId,
		amount: amount || booking.totalAmount || 25000,
		currency: "INR",
		transactionId: txId,
		paymentMethod: paymentMethod || "UPI",
		status: "Completed",
		receiptUrl: `/receipts/${txId}.pdf`,
	});

	// Transition booking state to Confirmed
	booking.status = "Confirmed";
	booking.paymentStatus = "Paid";
	booking.transactionId = txId;
	await booking.save();

	// Create user notification
	await Notification.create({
		userId: req.user?.id || booking.userId,
		title: "Payment Successful & Booking Confirmed!",
		message: `Payment of ₹${payment.amount.toLocaleString("en-IN")} via ${payment.paymentMethod} was confirmed (Txn: ${txId}). Your venue is reserved.`,
		type: "payment",
		link: "/bookings",
	});

	res.status(200).json(new ApiResponse(200, "Payment processed successfully", payment));
});

const getMyPayments = asyncHandler(async (req, res) => {
	const query = req.user?.role === "admin" ? {} : { userId: req.user?.id };
	const payments = await Payment.find(query).sort({ createdAt: -1 });
	res.status(200).json(new ApiResponse(200, "Payment records fetched successfully", payments));
});

module.exports = {
	checkout,
	getMyPayments,
};
