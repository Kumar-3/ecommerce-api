const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

async function authorizePostRequest(req, res, next) {
  if (req.method !== "POST") return next();

  const API = process.env.API_URL || "";

  // Public POST endpoints
  const publicEndpoints = [
    `${API}/login`,
    `${API}/register`,
    `${API}/forgot-password`,
    `${API}/verify-otp`,
    `${API}/reset-password`,
  ];

  if (publicEndpoints.some((ep) => req.originalUrl.startsWith(ep))) {
    return next();
  }

  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  let tokenData;
  try {
    tokenData = jwt.verify(
      authHeader.replace("Bearer ", ""),
      process.env.JWT_SECRET,
    );
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const message =
    "User conflict! The user making the request does not match the token.";

  // Case 1: user id in body
  if (req.body.user && tokenData.id !== req.body.user) {
    return res.status(403).json({ message });
  }

  // Case 2: user id in URL (/users/:id)
  const userMatch = req.originalUrl.match(/\/users\/([^/]+)/);
  if (userMatch) {
    const userIdFromUrl = userMatch[1];
    if (
      mongoose.isValidObjectId(userIdFromUrl) &&
      tokenData.id !== userIdFromUrl
    ) {
      return res.status(403).json({ message });
    }
  }

  // Attach user to request (optional but useful)
  req.user = tokenData;

  return next();
}

module.exports = authorizePostRequest;
