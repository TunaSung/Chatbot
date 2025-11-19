import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { signUp, signIn } from "../handlers/auth.hendler.js";
import { signUpSchema, signInSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/signup", validate(signUpSchema), signUp);
router.post("/signin", validate(signInSchema), signIn);

export default router;
