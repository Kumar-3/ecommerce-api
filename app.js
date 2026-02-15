const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
require("dotenv/config");

const authJwt = require("./middlewares/jwt");
const authorizePostRequest = require("./middlewares/authorization");
const errorHandler = require("./middlewares/error_handler");

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options(/.*/, cors());
app.use(authJwt());
require("./helpers/cron_job");

const env = process.env;
const port = env.PORT || 3000;
const hostname = env.HOSTNAME || "0.0.0.0";
const API = env.API_URL;

// Routes
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const adminRouter = require("./routes/admin");
const categoriesRouter = require("./routes/categories");
const productsRouter = require("./routes/products");
const checkoutRouter = require("./routes/checkout");
const ordersRouter = require("./routes/orders");

app.use(`${API}/`, authRouter);
app.use(`${API}/users`, authorizePostRequest, usersRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/categories`, categoriesRouter);
app.use(`${API}/products`, productsRouter);
app.use(`${API}/checkout`, checkoutRouter);
app.use(`${API}/orders`, ordersRouter);

app.use("/public", express.static(__dirname + "/public"));
app.use(errorHandler);
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Start server
app.listen(port, hostname, () => {
  console.log(`Server is running at http://${hostname}:${port}`);
});
