const ApiResponse = require("../utils/ApiResponse");
const { Notification } = require("../models");

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const getNotifications = asyncHandler(async (req, res) => {
	const notifications = await Notification.find({ userId: req.user?.id })
		.sort({ createdAt: -1 })
		.limit(30);

	const unreadCount = await Notification.countDocuments({
		userId: req.user?.id,
		isRead: false,
	});

	res.status(200).json(
		new ApiResponse(200, "Notifications fetched successfully", {
			notifications,
			unreadCount,
		})
	);
});

const markAsRead = asyncHandler(async (req, res) => {
	const { id } = req.params;
	await Notification.findOneAndUpdate({ _id: id, userId: req.user?.id }, { isRead: true });
	res.status(200).json(new ApiResponse(200, "Notification marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
	await Notification.updateMany({ userId: req.user?.id, isRead: false }, { isRead: true });
	res.status(200).json(new ApiResponse(200, "All notifications marked as read"));
});

module.exports = {
	getNotifications,
	markAsRead,
	markAllAsRead,
};
