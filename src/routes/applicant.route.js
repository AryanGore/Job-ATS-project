import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
    applyToJob,
    getApplicantProfile,
    updateApplicantProfile,
    updateApplicantResume,
    uploadApplicantResume
} from "../controller/applicant.controller.js";
import { applicantSignup } from "../controller/auth.controller.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = express.Router();
const uploadDir = path.resolve("public/uploads/resumes");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `resume-${req.user.id}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Unsupported file type. Please upload PDF, DOC, or DOCX."));
    }
});

router.post("/signup", applicantSignup);
router.get("/me", verifyJwt, authorizeRoles("APPLICANT"), getApplicantProfile);
router.patch("/me", verifyJwt, authorizeRoles("APPLICANT"), updateApplicantProfile);
router.patch("/resume", verifyJwt, authorizeRoles("APPLICANT"), updateApplicantResume);
router.post("/resume/upload", verifyJwt, authorizeRoles("APPLICANT"), upload.single("resume"), uploadApplicantResume);
router.post("/apply/:jobId", verifyJwt, authorizeRoles("APPLICANT"), applyToJob);

export default router;