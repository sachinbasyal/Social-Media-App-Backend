import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller.js";

const router = Router();

// Authentication
router.route("/register").post(registerUser)
router.route("/login").post(loginUser);


export default router
