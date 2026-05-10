import nodemailer from "nodemailer";

let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return _transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const result = await getTransporter().sendMail({
    from:    `"${process.env.APP_NAME || "Support"}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log("Email sent:", result.messageId);
};

export default sendEmail;