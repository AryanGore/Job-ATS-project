import express from "express";
import { applicantLogin, applicantLogout, recruiterLogin, recruiterLogout, refreshApplicantAccessToken, refreshRecruiterAccessToken } from "../controller/auth.controller.js";

const router = express.Router();

router.post('/login', applicantLogin);
router.post('/refresh', refreshApplicantAccessToken);
router.post('/logout', applicantLogout);

router.post('/recruiter/login', recruiterLogin);
router.post('/recruiter/refresh', refreshRecruiterAccessToken);
router.post('/recruiter/logout', recruiterLogout);

export default router;