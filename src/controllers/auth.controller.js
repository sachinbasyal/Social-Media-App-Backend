import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import {
  hashString,
  compareString,
  sendVerificationEmail,
} from "../utils/index.js";

// Generate Refresh and Access Tokens (JSON Web Tokens)
const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = jwt.sign(
      {
        _id: userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );

    const refreshToken = jwt.sign(
      {
        _id: userId,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error in generateRefreshAndAccessToken::", error);
    res.status(500).json({ message: error.message });
  }
};
// User registration
const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Validate fields
    if (
      [firstName, lastName, password, email].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return res
        .status(400)
        .json({ success: false, message: "User with email already exists" });
    }

    const hashedPassword = await hashString(password);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    // Send verification email to user
    sendVerificationEmail(user, res);
  } catch (error) {
    console.error("Error in registerUser::", error);
    res.status(500).json({ message: error.message });
  }
};

// Logging In
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and passwords are required" });
    }
    // Find user by email
    const user = await User.findOne({ email: email })
      .select("+password -refreshToken")
      .populate({
        path: "friends",
        select: "firstName lastName location profileUrl -password",
      });
      
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Compare passowrd
    const isPasswordValid = await compareString(password, user?.password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user?.verified) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "User email is not yet verified. Check your email account and verify your email",
        });
    }

    user.password = undefined;

    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
      user?._id
    );

    const options = { httpOnly: true, secure: true }; // here, cookie can't be modified in frontend and can only be modified by server

    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        user,
        accessToken,
        message: "User Logged-in successfully",
      });
  } catch (error) {
    console.log("Error in loginUser::", error);
    res.status(500).json({ message: error.message });
  }
};

// Handle Refresh Access Token endpoint
const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // req.body: ~from mobile apps

  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized request." });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Refresh token is either expired or already used.",
        });
    }

    const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        accessToken,
        refreshToken,
        message: "Access Token Refreshed",
      });
  } catch (error) {
    console.error("Error in refreshAccessToken::", error);
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, loginUser, refreshAccessToken };
