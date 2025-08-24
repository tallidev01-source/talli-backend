const router = require("express").Router();
const { model } = require("mongoose");
const { authMiddleware } = require ("../middlewares/authMiddleware");

const authController = require("../controllers/authController");

// auth
router.post("/login", authController.userLogin);
router.get("/user-logout", authController.userLogout);
router.post("/sign-up", authController.userSignUp);
router.get("/get-user",authMiddleware, authController.getUser);
router.post("/change-user-password",authMiddleware, authController.changePassword);




module.exports = router