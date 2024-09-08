import { Schema, model } from "mongoose";

const passwordResetSchema = new Schema(
  {
    userId: {type:String, unique: true},
    email: {type:String, unique:true},
    token: String,
    createdAt: Date,
    expiresAt: Date,

  },{timestamps:true})

export const PasswordReset = model("PasswordReset", passwordResetSchema)