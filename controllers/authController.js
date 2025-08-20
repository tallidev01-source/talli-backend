const userModel = require("../models/userModel");
const { createToken } = require("../utils/createToken");
const { responseReturn } = require("../utils/response");
const bcrypt = require("bcrypt");

class authController {
  userLogin = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return responseReturn(res, 409, {
        error: "All fields are required.",
      });
    }
    try {
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        console.log("LOGIN 01");
        return responseReturn(res, 401, {
          error: "Invalid email or password.",
        });
      }
      if (!user.password) {
        console.log("User object missing password:", user);
        return responseReturn(res, 401, {
          error: "Invalid email or password.",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return responseReturn(res, 401, {
          error: "Invalid email or password.",
        });
      }
      const token = await createToken({
        id: user._id,
        email: user.email,
        userName: user.userName,
      });
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      responseReturn(res, 200, {
        token,
        message: "Login successful.",
      });
    } catch (error) {
      console.log("ERROR", error);
      responseReturn(res, 500, {
        error: "Server error. Please try again later.",
      });
    }
  };

  userSignUp = async (req, res) => {
    let { username, email, password } = req.body;
    console.log(req.body);

    if (!username || !email || !password) {
      return responseReturn(res, 409, {
        error: "All fields are required.",
      });
    }

    try {
      const users = await userModel.findOne({ email });

      if (users) {
        return responseReturn(res, 409, {
          error: "Email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await userModel.create({
        userName: username,
        email,
        password: hashedPassword,
      });

      const token = await createToken({ id: user._id, email: user.email });
      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      responseReturn(res, 201, {
        token,
        message: "Trader Application Request Recorded.",
        requestMessage: "Trader Application Request Recorded.",
      });
    } catch {
      console.log("ERROR");
    }
  };

  getUser = async (req, res) => {
    const { id } = req;
    try {
      const user = await userModel.findById(id);
      // console.log("SELLER __________________________")
      // console.log(seller)
      responseReturn(res, 200, { userInfo: user });
    } catch (error) {
      responseReturn(res, 500, {
        error: "Internal Server Error",
      });
    }
  };

  changePassword = async (req, res) => {
    console.log("Asdasd")
    console.log(req.body)
    const { currentPassword, newPassword, retypedPassword } = req.body;
    const userId = req.id; // comes from auth middleware

    console.log(req.body)

    if (!currentPassword || !newPassword || !retypedPassword) {
      return responseReturn(res, 400, {
        error: "All fields are required.",
      });
    }

    if (newPassword !== retypedPassword) {
      return responseReturn(res, 400, {
        error: "New passwords do not match.",
      });
    }

    try {
      const user = await userModel.findById(userId).select("+password");
      if (!user) {
        return responseReturn(res, 404, {
          error: "User not found.",
        });
      }

      // compare old password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return responseReturn(res, 401, {
          error: "Current password is incorrect.",
        });
      }

      // hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return responseReturn(res, 200, {
        message: "Password updated successfully.",
      });
    } catch (err) {
      console.error("Change password error:", err);
      return responseReturn(res, 500, {
        error: "Server error. Please try again later.",
      });
    }
  };

  userLogout = async (req, res) => {

    console.log("LOGOUT")
  try {
    // Clear the token cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.MODE === "pro",
      sameSite: "strict",
    });

    return responseReturn(res, 200, {
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return responseReturn(res, 500, {
      error: "Server error. Please try again later.",
    });
  }
};
}

module.exports = new authController();
