import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { createPost, getPosts } from "../controllers/post.controller.js";
import { upload } from "../middleware/multer.middleware.js";


const router = Router();

// Create post
router.route("/create-post").post(verifyToken,createPost);

// Get Posts
router.route("/").get(verifyToken, getPosts);
// router.route("/:id").get(verifyToken, getPost);
// router.route("/get-user-post/:id").get(verifyToken, getUserPost);

// // Get comments
// router.route("/comments/:postId").get(verifyToken, getComments);

// // Like and Comment on posts
// router.route("/like/:id").post(verifyToken, likePost);
// router.route("/like-comment/:id/:rid").post(verifyToken, likePostComment);
// router.route("/comment/:id").post(verifyToken, commentPost);
// router.route("/reply-comment/:id").post(verifyToken, replyPostComment);

// // Delete post
// router.route("/:id").delete(verifyToken, deletePost);

export default router;
