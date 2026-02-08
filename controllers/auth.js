const { validationResult } = require("express-validator");
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Token } = require("../models/token");
const mailSender = require("../helpers/email_sender");
exports.register = async function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    return res.status(400).json({ errors: errorMessages });
  }

  try {
    let user = new User({
      ...req.body,
      passwordHash: bcrypt.hashSync(req.body.password, 8),
    });

    user = await user.save();
    if (!user) {
      return res.status(500).json({
        type: "Internal Server Error",
        message: "Could not create a new user",
      });
    }
    return res.status(201).json(user);
  } catch (error) {
    if (error.message.includes("email_1 dup key")) {
      return res.status(409).json({
        type: "AuthError",
        message: "User with that email already exists.",
      });
    }
    console.error("Registration error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.login = async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      return res.status(401).json({
        message: "User Not found\nCheck your email and try again.",
      });
    }
    if (!bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(400).json({
        message: "Incorrect password!",
      });
    }
    // Generate Access Token
    const accessToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "24h",
      },
    );
    // Generate Refresh Token
    const refreshToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "60d",
      },
    );

    const token = await Token.findOne({
      userId: user.id,
    });
    if (token) await token.deleteOne();
    await new Token({
      userId: user.id,
      accessToken,
      refreshToken,
    }).save();
    user.passwordHash = undefined;
    return res.status(200).json({
      ...user._doc,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    consoel.error("Login error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.verifyToken = async function (req, res) {
  try {
    let accessToken = req.headers.authorization;
    if (!accessToken) {
      return res.json(false);
    }
    accessToken = accessToken.replace("Bearer ", "").trim();
    const token = await Token.findOne({
      accessToken,
    });
    if (!token) {
      return res.json(false);
    }
    const tokenData = jwt.decode(token.refreshToken);
    const user = await User.findById(tokenData.id);
    if (!user) {
      return res.json(false);
    }
    const isValid = jwt.verify(
      token.refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    if (!isValid) {
      return res.json(false);
    }
    return res.json(true);
  } catch (error) {
    console.error("Verify token error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
exports.forgotPassword = async function (req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User with that email does not exist.",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    user.resetpasswordOtp = otp;
    user.resetpasswordOtpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    await mailSender.sendEmail(
      email,
      "Password Reset OTP",
      `<p>Your password reset OTP is <b>${otp}</b>. It is valid for 10 minutes.</p>`,
    );
    return res.status(200).json({
      message: "OTP sent to your email successfully.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      type: "EmailError",
      message: error.message || "Could not send OTP to your email.",
    });
  }
};
exports.verifyPasswordResetOtp = async function (req, res) {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    if (
      user.resetpasswordOtp !== +otp ||
      Date.now() > user.resetpasswordOtpExpiry
    ) {
      return res.status(401).json({
        message: "Invalid or expired OTP",
      });
    }
    user.resetpasswordOtp = 1;
    user.resetpasswordOtpExpiry = undefined;
    await user.save();
    return res.status(200).json({
      message: "OTP confirmed successfully.",
    });
  } catch (e) {
    console.log(`Verify Password error ${e}`);
    res.status(500).json({
      type: e.name,
      message: e.message,
    });
  }
};
exports.resetPasssword = async function (req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      }));
      return res.status(400).json({ errors: errorMessages });
    }
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }
    if (user.resetpasswordOtp != 1) {
      return res.status(401).json({
        message: "Confirm OTP before resetting password.",
      });
    }
    user.passwordHash = bcrypt.hashSync(newPassword, 8);
    user.resetpasswordOtp = undefined;
    await user.save();
    return res.json({
      message: "Password reset successfully!",
    });
  } catch (e) {
    console.log(`Reset Password error ${e}`);
  }
};
