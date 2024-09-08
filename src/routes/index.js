import { Router } from "express";
import authRouter from "./auth.route.js"
import userRouter from "./user.route.js"
import postRouter from "./post.route.js"

const router = Router();

router.use("/auth", authRouter) // auth/registerUser
router.use("/users",userRouter )
router.use("/posts", postRouter)

export default router;