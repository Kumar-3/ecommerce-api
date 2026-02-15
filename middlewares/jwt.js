const { expressjwt: expJwt } = require("express-jwt");
const { Token } = require("../models/token");

function authJwt() {
  const API = process.env.API_URL || "";

  return expJwt({
    secret: process.env.ACCESS_TOKEN_SECRET,
    algorithms: ["HS256"],
    isRevoked,
  }).unless({
    path: [
      `${API}/login`,
      `${API}/register`,
      `${API}/forgot-password`,
      `${API}/verify-otp`,
      `${API}/reset-password`,
    ],
  });
}

async function isRevoked(req, token) {
  try {
    const payload = token.payload;
    const storedToken = await Token.findOne({
      accessToken: token.token,
    });
    if (!storedToken) {
      return true;
    }

    const adminRouteRegex = new RegExp(`^${process.env.API_URL}/admin`, "i");
    if (adminRouteRegex.test(req.originalUrl) && !payload.isAdmin) {
      return true;
    }
    return false;
  } catch (err) {
    console.error("JWT revocation check failed:", err);
    return true;
  }
}

module.exports = authJwt;
