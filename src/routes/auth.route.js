import express from "express";
import {
    applicantLogin,
    applicantLogout,
    applicantSignup,
    getRecruiterDashboardStats,
    getRecruiterProfile,
    recruiterLogin,
    recruiterLogout,
    refreshApplicantAccessToken,
    refreshRecruiterAccessToken
} from "../controller/auth.controller.js";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = express.Router();

router.post('/signup', applicantSignup);
router.post('/login', applicantLogin);
router.post('/refresh', refreshApplicantAccessToken);
router.post('/logout', applicantLogout);

router.get('/recruiter/me', verifyJwt, authorizeRoles("ADMIN"), getRecruiterProfile);
router.get('/recruiter/dashboard', verifyJwt, authorizeRoles("ADMIN"), getRecruiterDashboardStats);
router.post('/recruiter/login', recruiterLogin);
router.post('/recruiter/refresh', refreshRecruiterAccessToken);
router.post('/recruiter/logout', recruiterLogout);

export default router;