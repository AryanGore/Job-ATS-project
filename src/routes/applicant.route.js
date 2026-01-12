import express from "express";
// import {Router} from "express";
import { applyToJob, createApplicant } from "../controller/applicant.controller.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getSingleApplication } from "../controller/application.controller.js";

const router = express.Router();

router.post("/signup", createApplicant);

// router.post("/signup", (req, res) => {
//     console.log("Signup route hit!");
//     res.json({ success: true, message: "Signup route reached" });
// });

router.post("/apply/:jobId", verifyJwt, authorizeRoles("APPLICANT"), applyToJob) //created apply to jov endpoint.


export default router;