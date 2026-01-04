# 🛒 E-commerce Backend API

A production-ready backend API for an e-commerce platform built with **Node.js**, **Express**, and **MongoDB**. This project provides secure authentication, authorization, and core e-commerce features such as user management, products, and orders.

---

## 🚀 Features

* User authentication (JWT-based)
* Role-based authorization (Admin / User)
* Secure password hashing using bcrypt
* Product management APIs
* Order and cart handling
* Input validation using express-validator
* Environment-based configuration
* Email support using Nodemailer
* MongoDB database with Mongoose ODM
* Request logging with Morgan

---

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js (v5)
* **Database:** MongoDB
* **ODM:** Mongoose
* **Authentication:** JWT (JSON Web Token)
* **Security:** bcryptjs
* **Validation:** express-validator
* **Email:** Nodemailer

---

## 📁 Project Structure

```
backend/
├── app.js
├── helpers/
├── controllers/
├── models/
├── routes/
├── utils/
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/Kumar-3/ecommerce-api.git
cd ecommerce-api
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Environment variables

Create a `.env` file in the root directory and add the following environment variables:

```
HOSTNAME=localhost
PORT=3000
MONGODB_CONNECTION_STRING=mongodb://127.0.0.1:27017/ecommerce_db
API_URL=/api/v1
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

## ▶️ Running the Project

### Development mode

```
npm start
```

The server will start at:

```
http://localhost:3000
```

---

## 🔐 Authentication Flow

1. User registers with email & password
2. Password is hashed using bcrypt
3. JWT token is generated on login
4. Protected routes validate JWT
5. Role-based access is enforced using middleware

---

## 📌 API Modules (High Level)

* Auth (Register / Login)
* Users
* Products
* Orders
* Cart

> Detailed API documentation can be added later using Postman or Swagger.

---

## 📦 NPM Scripts

| Command     | Description                |
| ----------- | -------------------------- |
| `npm start` | Start server with nodemon  |
| `npm test`  | Run tests (not configured) |

---

## 🧪 Validation & Error Handling

* Input validation using express-validator
* Centralized error handling middleware
* Meaningful HTTP status codes

---

## 📌 Future Improvements

* Payment gateway integration
* Order tracking
* Swagger API documentation
* Unit & integration tests
* Docker support

---

## 🤝 Contributing

Contributions are welcome. Please open an issue or submit a pull request.

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Kumar Kharare**  
Mobile App Developer | Backend (Node.js, MongoDB)

---

⭐ If you like this project, give it a star!
