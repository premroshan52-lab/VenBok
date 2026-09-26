const express = require("express");
const paymentController = require("../controllers/payment.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(requireAuth);
router.post("/checkout", paymentController.checkout);
router.get("/my-payments", paymentController.getMyPayments);

module.exports = router;
