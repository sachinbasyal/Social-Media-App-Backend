import { User } from "../models/user.model.js";
import { EmailVerification } from "../models/emailVerification.model.js";
import { PasswordReset } from "../models/passwordReset.model.js";
import { FriendRequest } from "../models/friendRequest.model.js";
import {
  ApiError,
  ApiResponse,
  compareString,
  hashString,
} from "../utils/index.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import { isValidObjectId } from "mongoose";

// Handle Email Verification endpoint
const verifyEmail = async (req, res) => {
  const { userId, token } = req.params;

  try {
    if (!isValidObjectId(userId)) throw new ApiError(409, "Invalid User ID");

    const data = await EmailVerification.findOne({ userId }); // ~findById(userId)

    if (data) {
      // Check if the link (token) has expired
      const { expiresAt, token: hashedToken } = data;

      if (expiresAt < Date.now()) {
        EmailVerification.findOneAndDelete({ userId }) // ~findByIdAndDelete(userId)
          .then(() => {
            User.findOneAndDelete({ _id: userId })
              .then(() => {
                const message = "Verification token has expired";
                res.redirect(
                  `/api/v1/users/verified?status=error&message=${message}`
                );
              })
              .catch((error) => {
                console.log(error);
                res.redirect(`/api/v1/users/verified?status=error&message=`);
              });
          })
          .catch((error) => {
            console.log(error);
            res.redirect(`/api/v1/users/verified?message=`);
          });
      } else {
        // Link is active. Check if the token is valid
        compareString(token, hashedToken)
          .then((isValid) => {
            if (isValid) {
              User.findOneAndUpdate(
                { _id: userId },
                { verified: true },
                { new: true }
              )
                .then(() => {
                  EmailVerification.findOneAndDelete({ userId }).then(() => {
                    const message = "Email verified successfully!";
                    res.redirect(
                      `/api/v1/users/verified?status=success&message=${message}`
                    );
                  });
                })
                .catch((error) => {
                  console.log(error);
                  const message = "Verification failed or link is invalid";
                  res.redirect(
                    `/api/v1/users/verified?status=error&message=${message}`
                  );
                });
            } else {
              // invalid token
              const message = "Verification failed or link is invalid";
              res.redirect(
                `/api/v1/users/verified?status=error&message=${message}`
              );
            }
          })
          .catch((error) => {
            console.log(error);
            res.redirect(`/api/v1/users/verified?message=`);
          });
      }
    } else {
      const message = "Invalid verification link.";
      res.redirect(`/api/v1/users/verified?status=error&message=${message}`);
    }
  } catch (error) {
    console.error("Error in verifyEmail::", error);
    res.redirect(`/api/v1/users/verified?message=`);
  }
};

// Handle Password Reset Request endpoint
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({success:false, message: "Email not found!" });
    }

    const existingRequest = await PasswordReset.findOne({ email });

    if (existingRequest) {
      if (existingRequest.expiresAt > Date.now()) {
        return res.status(201).json({
          status: "Pending",
          message: "Reset password link has already been sent to your email.",
        });
      } else await PasswordReset.findOneAndDelete({ email });
    }

    await resetPasswordLink(user, res);
  } catch (error) {
    console.error("Error in requestPasswordReset::", error);
    res.status(500).json({ message: error.message });
  }
};

//Handle Password Reset Endpoint
const resetPassword = async (req, res) => {
  const { userId, token } = req.params;

  try {
    if (!isValidObjectId(userId)) throw new ApiError(409, "Invalid User ID");

    // Find record
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success:false, message: "Invalid Password Reset Link." });
    }

    const data = await PasswordReset.findOne({ userId });

    if (!data) {
      return res.status(404).json({
        success:false,
        message: "Invalid or Expired Password Reset Link.",
      });
    }
    // Check if the link (token) has expired
    const { expiresAt, token: resetToken } = data;

    if (expiresAt < Date.now()) {
      return res.status(404).json({
        success:false,
        message: "Reset Password Link has expired.",
      });
    } else {
      // Link is active. Check if the token is valid
      const isValid = await compareString(token, resetToken);

      if (!isValid) {
        return res
          .status(404)
          .json({ success:false, message: "Invalid Password Reset Link." });
      } else {
        res.redirect(`/api/v1/users/resetpassword?type=reset&id=${userId}`);
      }
    }
  } catch (error) {
    console.error("Error in resetPassword::", error);
    res.status(500).json({ message: error.message });
  }
};

// Handle Change Current Password endpoint
const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const hashedpassword = await hashString(password);

    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { password: hashedpassword }
    );

    if (user) {
      await PasswordReset.findOneAndDelete({ userId });

      return res
        .status(200)
        .json({success:true, message:"Password successfully reset."});
      // const message = "Password successfully reset.";
      // res.redirect(
      //   `/api/v1/users/resetpasswort?status=success&message=${message}`
      // );
      // return;
    }
  } catch (error) {
    console.error("Error in changePassword::", error);
    res.status(500).json({ message: error.message });
  }
};

// Get user details
const getUser = async (req, res) => {
  try {
    const { userId } = req.body?.user;
    const { id } = req.params;
    const user = await User.findById(id ?? userId).populate({
      path: "friends",
      select: "-password",
    });

    if (!user) {
      return res.status(404).send({
        message: "User Not Found",
        success: false,
      });
    }

    user.password = undefined;
    user.refreshToken = undefined;

    return res
      .status(200)
      .json({success:true, user, message: "User details fetched successfully."})
  } catch (error) {
    console.error("Error in getUser::", error);
    res
      .status(500)
      .json({ message: "Server Error", success: false, error: error.message });
  }
};

// Update user details
const updateUser = async (req, res) => {
  const { firstName, lastName, location, profileUrl, profession } = req.body;

  try {
    if (!(firstName || lastName || location || profileUrl)) {
      return res
        .status(404)
        .json({ success:false, message: "Please provide the required fields." });
    }

    const { userId } = req.body.user;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          firstName,
          lastName,
          location,
          profileUrl,
          profession,
        },
      },
      { new: true } // returns new updated data
    ).populate({path:"friends", select:"-password"});
    
    //const accessToken = createRefreshAndAccessToken(user?._id)

    user.password = undefined;

    return res
      .status(200).json({success:true, user, message:"User details updated successfully"})
  } catch (error) {
    console.error("Error in updateUser::", error);
    res
      .status(500)
      .json({ message: "Server Error", success: false, error: error.message });
  }
};

// Send Friend Request
const sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body?.user;
    const { requestTo } = req.body;

    const requestExist = await FriendRequest.findOne({
      requestFrom: userId,
      requestTo,
    });

    if (requestExist) {
      return res
        .status(401)
        .json({ success:false, message: "Friend request already sent." });
    }

    const requestBySender = await FriendRequest.findOne({
      requestFrom: requestTo,
      requestTo: userId,
    });

    if (requestBySender) {
      return res
        .status(401)
        .json({ success:false, message: "Friend request already sent by the sender." });
    }

    const newFriendRequest = await FriendRequest.create({
      requestTo,
      requestFrom: userId,
    });

    if (!newFriendRequest) {
      return res.status(500).json({
        message: "Something went wrong while creating a new friend request.",
        success: false,
        error: error.message,
      });
    }

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Friend Request sent successfully."));
  } catch (error) {
    console.error("Error in sendFriendRequest::", error);
    res
      .status(500)
      .json({ message: "Auth Error", success: false, error: error.message });
  }
};

// Get Friend Request
const getFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body?.user;

    const request = await FriendRequest.find({
      requestTo: userId,
      requestStatus: "Pending",
    })
      .populate({
        path: "requestFrom",
        select: "firstName lastName profileUrl profession -password",
      })
      .limit(10)
      .sort({ _id: -1 });

    if (!request) {
      return res.status(500).json({
        message:
          "Something went wrong with the Server while fetching friend requests.",
        success: false,
      });
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, request, "Friend requests fetched successfully.")
      );
  } catch (error) {
    console.error("Error in getFriendRequest::", error);
    res
      .status(500)
      .json({ message: "Auth Error", success: false, error: error.message });
  }
};

// Accept Friend Request
const acceptFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.body?.user;
    const { rid, status } = req.body;

    if (!isValidObjectId(rid)) throw new ApiError(401, "Invalid Reqeust ID");

    const requestExist = await FriendRequest.findById(rid);

    if (!requestExist) {
      return res
        .status(401)
        .json({ success:false, message: "No any friend requests found" });
    }

    if(requestExist.requestStatus ==="Accepted") {
      return res
        .status(401)
        .json({ success:false, message: "Friend request already accepted." });
    }
    
    const newRequest = await FriendRequest.findByIdAndUpdate(
      { _id: rid },
      { requestStatus: status }
    );

    if (status === "Accepted") {
      const user = await User.findById(userId);
      user.friends.push(newRequest?.requestFrom);
      await user.save();
      const friend = await User.findById(newRequest?.requestFrom);
      friend.friends.push(newRequest?.requestTo);
      await friend.save();
    }

    res.status(201).json({
      success: true,
      message: "Friend Request " + status,
    });
  } catch (error) {
    console.error("Error in acceptFriendRequest::", error);
    res
      .status(500)
      .json({ message: "Server Error", success: false, error: error.message });
  }
};

// Handle Profile Views
const profileViews = async (req, res) => {
  try {
    const { userId } = req.body?.user;
    const { id } = req.body;

    if (!isValidObjectId(id)) throw new ApiError(401, "Invalid User ID");

    const user = await User.findById(id);
    user.views.push(userId);
    //user.views.push(userId);
    await user.save();

    if (!user) {
      return res
        .status(401)
        .json({ success:false, message: "User not found." });
    }

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Profile views fetched successfully"));
  } catch (error) {
    console.error("Error in profileViews::", error);
    res
      .status(500)
      .json({ message: "Auth Error", success: false, error: error.message });
  }
};

// Handle Suggested Friends
const suggestedFriends = async (req, res) => {
  try {
    const { userId } = req.body?.user;

    let queryObject = {};
    queryObject._id = { $ne: userId };
    queryObject.friends = { $nin: userId };

    let queryResult = User.find(queryObject)
      .limit(10)
      .select("firstName lastName profileUrl profession -password");

    const suggestedFriends = await queryResult;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          suggestedFriends,
          "Suggested Friends fetched successfully."
        )
      );
  } catch (error) {
    console.error("Error in suggestedFriends::", error);
    res
      .status(500)
      .json({ message: "Server Error", success: false, error: error.message });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  const { userId } = req.body?.user;
  await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({success:true, message:"User logged out successfully"})
};

export {
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getUser,
  updateUser,
  sendFriendRequest,
  getFriendRequest,
  acceptFriendRequest,
  profileViews,
  suggestedFriends,
  logoutUser,
};
