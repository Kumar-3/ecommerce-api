const { Order } = require("../../models/order");
const { OrderItem } = require("../../models/order_item");
exports.getOrders = async function (req, res) {
  try {
    const orders = await Order.find()
      .select("-statusHistory")
      .populate("user", "name email phone")
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          select: "name",
          populate: {
            path: "category",
            select: "name",
          },
        },
      })
      .sort({ dateOrdered: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        message: "Orders not found",
      });
    }

    return res.status(200).json(orders);
  } catch (error) {
    console.error(`Get Orders error: ${error.message}`);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.getOrderCount = async function (req, res) {
  try {
    const count = await Order.countDocuments();
    if (!count) {
      return res.status(500).json({
        message: "Could not count orders!",
      });
    }
    return res.json({ count: count });
  } catch (e) {
    console.error(`Get orders count error ${e}`);
    return res.status(500).json({ type: e.type, message: e.messages });
  }
};
exports.changeOrderStatus = async function (req, res) {
  try {
    const orderId = req.params.id;
    const { status: newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        message: "New status is required",
      });
    }

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // push old status to history (avoid duplicates)
    if (
      order.status &&
      (!order.statusHistory || !order.statusHistory.includes(order.status))
    ) {
      order.statusHistory.push(order.status);
    }

    order.status = newStatus;
    order = await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error(`Change order status error: ${error.message}`);
    return res.status(500).json({
      message: error.message,
    });
  }
};

exports.deleteOrder = async function (req, res) {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Delete all order items in parallel
    if (order.orderItems && order.orderItems.length > 0) {
      await OrderItem.deleteMany({
        _id: { $in: order.orderItems },
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(`Delete order error: ${error.message}`);
    return res.status(500).json({
      message: error.message,
    });
  }
};
