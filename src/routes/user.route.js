import { Router } from "express";
import path from "path";
import {verifyToken} from "../middleware/auth.middleware.js"
import { requestPasswordReset, resetPassword, verifyEmail, changePassword,getUser, updateUser, sendFriendRequest, getFriendRequest,acceptFriendRequest,logoutUser, profileViews, suggestedFriends } from "../controllers/user.controller.js";

const router = Router();
const __dirname = path.resolve(path.dirname(""));

// Verify User
router.route("/verify/:userId/:token").get(verifyEmail);

// Password Reset
router.route("/request-password-reset").post(requestPasswordReset);
router.route("/reset-password/:userId/:token").get(resetPassword)
router.route("/reset-password").post(changePassword);

// Secured User routes
router.route("/get-user/:id?").get(verifyToken, getUser)
router.route("/update-user").put(verifyToken, updateUser)
router.route("/logout").post(verifyToken, logoutUser)

// Friend Request routes
router.route("/friend-request").post(verifyToken, sendFriendRequest);
router.route("/get-friend-request").get(verifyToken, getFriendRequest);

// Accept/Deny Friend Request
router.route("/accept-friend-request").post(verifyToken, acceptFriendRequest);

// View Pofile
router.route("/profile-view").post(verifyToken, profileViews)

// Suggested Friends
router.route("/suggested-friends").post(verifyToken, suggestedFriends)

// URL Path joins
router.route("/verified").get((req, res) => {
  res.sendFile(path.join(__dirname, "/src/views/build", "index.html"));
});

router.route("/resetpassword").get((req, res) => {
  res.sendFile(path.join(__dirname, "/src/views/build", "index.html"));
});

export default router;
