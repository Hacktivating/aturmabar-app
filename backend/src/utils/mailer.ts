import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (toEmail: string, token: string, clientUrl: string) => {
  const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"AturMabar" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify Your AturMabar Account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to AturMabar</h2>
        <p>Thank you for signing up. Please click the button below to verify your email address and activate your account:</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (toEmail: string, token: string, clientUrl: string) => {
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"AturMabar" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendEmailChangeVerification = async (toEmail: string, token: string, clientUrl: string) => {
  const verifyUrl = `${clientUrl}/verify-email-change?token=${token}`;
  
  const mailOptions = {
    from: `"AturMabar" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify Your New Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Email Change Request</h2>
        <p>Click the button below to confirm this email address for your account:</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};