import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyToken = async (req, _, next) => {
  try {
    const token =
      req?.cookies?.accessToken ||
      req?.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(403, "Access denied");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // const user = await User.findById(decodedToken?._id).select("-password");
    // if (!user) throw new ApiError(401, "Invalid Access Token");
    // req.user = user // injecting user into req.user

    req.body.user = { userId: decodedToken?._id };

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
};
