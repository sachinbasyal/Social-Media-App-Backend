import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { hashString } from "./hashString.js";
import { EmailVerification } from "../models/emailVerification.model.js";
import { PasswordReset } from "../models/passwordReset.model.js";

dotenv.config();

const { AUTH_EMAIL, AUTH_PASSWORD, APP_URL } = process.env;

let transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  auth: {
    user: AUTH_EMAIL,
    pass: AUTH_PASSWORD,
  },
});

export const sendVerificationEmail = async (user, res) => {
  const { _id, email, lastName } = user;
  
  const token = _id + uuidv4();
  const link = APP_URL + "/users/verify/" + _id + "/" + token;

  // Mail options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Email Verification",
    html: `<div style='font-family: Arial, sans-serif; font-size: 16px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
      <h3 style="color: rgb(8, 56, 188)">Please verify your email address!</h3>
      <hr>
      <h4>Hi ${lastName},</h4>
      <p>
          Please verify your email address so we can know that it's really you.
          <br>
      <p>This link <b>expires in 1 hour</b></p>
      <br>
      <a href=${link}
        style="color: #fff; padding: 14px; text-decoration: none; background-color: #000;  border-radius: 8px; font-size: 16px;">Verify Email Address</a>
      </p>
      <div style="margin-top: 20px;">
      <br>
          <p>Best Regards</p>
          <h5>SocioMedia Team</h5>
      </div>
    </div>`,
  };

  try {
    const hashedToken = await hashString(token);

    const newVerifiedEmail = await EmailVerification.create({
      userId: _id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000, // time:ms (1 hr)
    });

    if (newVerifiedEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).send({
            success: "Pending",
            message: "Verification email has been sent to your email account. Please check your email for further instructions.",
          });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({
            message:
              "Something went wrong with the Server while sending verification email",
          });
        });
    }
  } catch (error) {
    console.error("Error in sendVerificationEmail::", error);
    res.status(500).json({ message: error.message });
  }
};


export const resetPasswordLink = async (user, res) => {
  const { _id, email, lastName } = user;

  const token = _id + uuidv4();
  const link = APP_URL + "/users/reset-password/" + _id + "/" + token;

  // Mail options
  const mailOptions = {
    from: AUTH_EMAIL,
    to: email,
    subject: "Password Reset Link!",
    html: `<div style='font-family: Arial, sans-serif; font-size: 20px; color: #333; background-color: #f7f7f7; padding: 20px; border-radius: 5px;'>
        <hr>
      <h4>Hi ${lastName},</h4>
        <p> Password Reset Link. Please click the link below to reset your password.</p>
        <br>
        <p style="font-size: 18px;"><b>This link expires in 10 minutes</b></p>
         <br>
        <a href=${link} style="color: #fff; padding: 10px; text-decoration: none; background-color: #000;  border-radius: 8px; font-size: 18px; ">Reset Password</a>.
         <div style="margin-top: 20px;">
            <br>
            <p>Best Regards</p>
          <h5>SocioMedia Team</h5>
      </div>
    </div>`,
  };

  try {
    const hashedToken = await hashString(token);

    const resetEmail = await PasswordReset.create({
      userId: _id,
      email: email,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, // 10 mins
    });

    if (resetEmail) {
      transporter
        .sendMail(mailOptions)
        .then(() => {
          res.status(201).json({
            success: "Pending",
            message: "Reset Password Link has been sent to your email.",
          });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).json({
            message:
              "Something went wrong while sending password reset email",
          });
        });
    }
  } catch (error) {
    console.error("Error in resetPasswordLink::", error);
    res.status(500).json({ message: error.message });
  }
};
