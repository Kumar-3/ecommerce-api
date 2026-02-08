const { User } = require("../models/user");

exports.getUsers = async (_, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    if (!users) {
      return res.status(404).json({
        message: "No users found.",
      });
    }

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-passwordHash -resetpasswordOtp -resetpasswordOtpExpiry -__v -cart",
    );
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true, runValidators: true },
    ).select(
      "-passwordHash -resetpasswordOtp -resetpasswordOtpExpiry -__v -cart",
    );
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({
      type: error.name,
      message: error.message,
    });
  }
};
