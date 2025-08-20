const router = require("express").Router();
const { model } = require("mongoose");
const { authMiddleware } = require ("../middlewares/authMiddleware");

const paymentController = require("../controllers/paymentController");

// auth
router.post("/add-payment",authMiddleware, paymentController.addPayment);
router.get("/get-payer-payment", paymentController.getPaymentStatusByMonth);
// 





module.exports = router;