const router = require("express").Router();
const { model } = require("mongoose");
const { authMiddleware } = require ("../middlewares/authMiddleware");

const payerController = require("../controllers/payerController")

// auth
router.post("/add-payer",authMiddleware, payerController.addPayer);
router.delete("/remove-payer/:payerId",authMiddleware, payerController.removePayer);
router.post("/update-payer",authMiddleware, payerController.updatePayer);
router.get("/get-my-payers/:selectedDate",authMiddleware,payerController.getPayers);
// router.get("/get-my-payers",payerController.getPayers);



module.exports = router