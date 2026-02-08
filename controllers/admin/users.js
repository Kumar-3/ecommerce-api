const { User } = require("../../models/users");
const { Order } = require("../../models/order");
const { OrderItem } = require("../../models/order_item");
const { CartProduct } = require("../../models/cart_product");
const { Token } = require("../../models/token");
exports.getUserCount = async (_, res) => {
  try {
    const userCount = await User.countDocuments();

    return res.status(200).json({
      userCount,
    });
  } catch (e) {
    console.error("Get user count error:", e);
    return res.status(500).json({
      type: e.name,
      message: e.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Delete orders and order items
    const orders = await Order.find({ user: userId });
    const orderItemIds = orders.flatMap((order) => order.orderItems);

    await Order.deleteMany({ user: userId });
    await OrderItem.deleteMany({ _id: { $in: orderItemIds } });

    // Delete cart products (if stored separately)
    if (user.cart && user.cart.length > 0) {
      await CartProduct.deleteMany({ _id: { $in: user.cart } });
    }

    // Delete tokens
    await Token.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    return res.status(204).json({
      message: "User deleted successfully",
    });
  } catch (e) {
    console.error("Delete user error:", e);
    return res.status(500).json({
      type: e.name,
      message: e.message,
    });
  }
};
