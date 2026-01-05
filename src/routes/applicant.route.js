import express from "express";
// import {Router} from "express";
import {createApplicant} from "../controller/applicant.controller.js";

const router = express.Router();

router.post("/signup", createApplicant);

// router.post("/signup", (req, res) => {
//     console.log("Signup route hit!");
//     res.json({ success: true, message: "Signup route reached" });
// });

export default router;