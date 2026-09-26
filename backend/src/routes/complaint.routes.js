const express = require("express");
const complaintController = require("../controllers/complaint.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", complaintController.getComplaints);
router.post("/", complaintController.createComplaint);
router.patch("/:id/status", complaintController.updateComplaintStatus);

module.exports = router;
