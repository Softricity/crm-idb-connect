import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: parseInt(process.env.SMTP_PORT || "587") === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export function generateRandomPassword(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 3. Create the email sending function
export async function sendWelcomeEmail(email: string, password: string) {
  const mailOptions = {
    from: `"IDB Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Welcome to Your Student Panel!",
    html: `
      <h1>Welcome!</h1>
      <p>Your account for the student panel has been created.</p>
      <p>You can now log in using these credentials:</p>
      <ul>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Click here to login: <a href="https://student.idbconnect.global/login">Student Panel Login</a></p>
      <p>Thanks,</p>
      <p>The IDB Connect Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to:", email);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    // You might want to throw this error so the API can catch it
    throw new Error("Failed to send welcome email.");
  }
}