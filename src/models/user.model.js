import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      min: 2,
      max: 20,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      min: 2,
      max: 20,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password length should be greater than 6 characters"],
      select: true
    },
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref:"User"
      },
    ],
    profileUrl: String,
    location: String,
    profession: String,
    views: [{ type: String }],
    verified: {
      type: Boolean,
      default: false
    },
    refreshToken: String
  },{timestamps:true})

export const User = model("User", userSchema)