const jwt = require("jsonwebtoken");
const { Token } = require("../models/token");
const { User } = require("../models/users");

async function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    if (!err.message.includes("jwt expired")) {
      return res.status(401).json({
        type: "Unauthorized",
        message: "Unauthorized access",
      });
    }

    try {
      const tokenHeader = req.headers.authorization;
      const authToken = tokenHeader?.split(" ")[1];

      const token = await Token.findOne({
        accessToken: authToken,
        refreshToken: { $exists: true },
      });

      if (!token) {
        return res.status(401).json({
          type: "Unauthorized",
          message: "Please log in again.",
        });
      }

      const payload = jwt.verify(
        token.refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );

      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({
          type: "Unauthorized",
          message: "User not found.",
        });
      }

      const newAccessToken = jwt.sign(
        { userId: payload.userId, isAdmin: payload.isAdmin },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
      );

      token.accessToken = newAccessToken;
      await token.save();

      res.set("Authorization", `Bearer ${newAccessToken}`);
      req.headers.authorization = `Bearer ${newAccessToken}`;

      return next();
    } catch (e) {
      return res.status(401).json({
        type: "Unauthorized",
        message: e.message,
      });
    }
  }

  return res.status(err.status || 500).json({
    type: err.name || "Error",
    message: err.message || "Server error",
  });
}

module.exports = errorHandler;
