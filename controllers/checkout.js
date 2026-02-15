const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const { User } = require("../models/user");
const { Product } = require("../models/product");
const { orderController } = require("./orders");
const { sendEmail } = require("../helpers/email_sender");
exports.checkout = async function (req, res) {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ message: "Missing token" });
    }

    const accessToken = authHeader.replace("Bearer ", "").trim();
    const tokenData = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(tokenData.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate stock
    for (const cartItem of req.body.cartItems) {
      const product = await Product.findById(cartItem.productId);
      if (!product) {
        return res.status(404).json({ message: `${cartItem.name} not found` });
      }

      if (!cartItem.reserved && product.countInStock < cartItem.quantity) {
        return res.status(400).json({
          message: `${product.name}: only ${product.countInStock} left`,
        });
      }
    }

    // Stripe customer
    let customerId = user.paymentCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: tokenData.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,

      line_items: req.body.cartItems.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.name,
            images: item.images ? [item.images] : [],
            metadata: {
              productId: item.productId,
              cartProductId: item.cartProductId,
              selectedSize: item.selectedSize ?? "",
              selectedColor: item.selectedColor ?? "",
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),

      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["IN"],
      },
      phone_number_collection: { enabled: true },

      success_url: "https://httpstat.us/200",
      cancel_url: "https://httpstat.us/403",
    });

    return res.status(201).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.webhook = async function (req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout success
  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object;

      // Get Stripe customer
      const customer = await stripe.customers.retrieve(session.customer);

      // Get line items
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { expand: ["data.price.product"] },
      );

      // Build order items
      const orderItems = lineItems.data.map((item) => ({
        quantity: item.quantity,
        product: item.price.product.metadata.productId,
        cartProductId: item.price.product.metadata.cartProductId,
        productPrice: item.price.unit_amount / 100,
        productName: item.price.product.name,
        productImage: item.price.product.images?.[0] || "",
        selectedSize: item.price.product.metadata.selectedSize,
        selectedColor: item.price.product.metadata.selectedColor,
      }));

      // Address
      const address =
        session.shipping_details?.address ?? session.customer_details?.address;

      // Create order in DB
      const order = await orderController.addOrder({
        orderItems,
        shippingAddress: address.line1,
        city: address.city,
        phone: session.customer_details.phone,
        totalPrice: session.amount_total / 100,
        userId: customer.metadata.userId,
        paymentId: session.payment_intent,
      });

      // Save Stripe customer ID if not exists
      const user = await User.findById(customer.metadata.userId);

      if (user && !user.paymentCustomerId) {
        user.paymentCustomerId = session.customer;
        await user.save();
      }

      // ✅ SEND EMAIL HERE
      if (user && user.email) {
        const emailBody = `
          <h2>Order Confirmed ✅</h2>

          <p>Your payment was successful.</p>

          <p>
            <strong>Order ID:</strong> ${order._id}<br/>
            <strong>Total:</strong> ₹${order.totalPrice}
          </p>

          <p>We will notify you when your order ships.</p>

          <br/>

          <p>Thank you,<br/>Your Store Team</p>
        `;

        await sendEmail(user.email, "Order Confirmation", emailBody);

        console.log("Order confirmation email sent to:", user.email);
      }
    } catch (error) {
      console.error("Webhook order creation error:", error);
    }
  }

  res.status(200).json({ received: true });
};
