import { Schema, model } from "mongoose";

const emailVerfificationSchema = new Schema(
  {
    userId: String,
    token: String,
    createdAt: Date,
    expiresAt: Date,

  },{timestamps: true})

  export const EmailVerification = model("EmailVerfification", emailVerfificationSchema)