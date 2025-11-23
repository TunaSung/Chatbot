import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { signUp, signIn, logout } from "../handlers/auth.hendler.js";
import { signUpSchema, signInSchema, refreshSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/signup", validate(signUpSchema), signUp);
router.post("/signin", validate(signInSchema), signIn);
router.post("/logout", validate(refreshSchema), logout);

export default router;
