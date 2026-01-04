const nodemailer = require("nodemailer");

exports.sendEmail = async (email, subject, body) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: body,
    };

    await transporter.sendMail(mailOptions);

    return "Password reset OTP sent to your email";
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};
