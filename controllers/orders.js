const { default: mongoose } = require("mongoose");
const { User } = require("../models/user");
const { Product } = require("../models/product");
const { CartProduct } = require("../models/cart_product");
const { OrderItem } = require("../models/order_item");
const { Order } = require("../models/order");
exports.addOrder = async function (orderData) {
  if (!mongoose.isValidObjectId(orderData.userId)) {
    throw new Error("Invalid user ID");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingOrder = await Order.findOne({
      paymentId: orderData.paymentId,
    }).session(session);

    if (existingOrder) {
      await session.commitTransaction();
      return existingOrder;
    }

    const user = await User.findById(orderData.userId).session(session);

    if (!user) {
      throw new Error("User not found");
    }

    const orderItemIds = [];

    for (const orderItem of orderData.orderItems) {
      const cartProduct = await CartProduct.findById(
        orderItem.cartProductId,
      ).session(session);

      if (!cartProduct) {
        throw new Error("Cart product not found");
      }

      if (!user.cart.includes(cartProduct._id)) {
        throw new Error("Cart product does not belong to user");
      }

      const orderItemModel = await new OrderItem(orderItem).save({
        session,
      });

      orderItemIds.push(orderItemModel._id);

      await CartProduct.findByIdAndDelete(cartProduct._id).session(session);

      user.cart.pull(cartProduct._id);
    }

    await user.save({ session });

    orderData.orderItems = orderItemIds;

    let order = new Order(orderData);

    order.status = "Processed";
    order.statusHistory.push("Processed");

    order = await order.save({ session });

    if (!order) {
      throw new Error("Order creation failed");
    }

    await session.commitTransaction();

    return order;
  } catch (err) {
    await session.abortTransaction();

    console.error("Order creation error:", err);

    throw err;
  } finally {
    session.endSession();
  }
};
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const orders = await Order.find({ user: userId })
      .select("orderItems status totalPrice dateOrdered")
      .populate({
        path: "orderItems",
        select: "productName productImage",
      })
      .sort({ dateOrdered: -1 });

    if (orders.length === 0) {
      return res.json({
        total: 0,
        active: [],
        completed: [],
        cancelled: [],
      });
    }

    const completed = [];
    const active = [];
    const cancelled = [];

    for (const order of orders) {
      if (order.status === "delivered") {
        completed.push(order);
      } else if (order.status === "cancelled" || order.status === "expired") {
        cancelled.push(order);
      } else {
        active.push(order);
      }
    }

    return res.json({
      total: orders.length,
      active,
      completed,
      cancelled,
    });
  } catch (e) {
    console.error("Get Users Order error:", e);
    return res.status(500).json({
      message: e.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId).populate({
      path: "orderItems",
      select:
        "productName productImage productPrice quantity selectedSize selectedColor",
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.json(order);
  } catch (e) {
    console.error("Get Order by ID error:", e);
    return res.status(500).json({
      message: e.message,
    });
  }
};
