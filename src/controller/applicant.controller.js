import mongoose from "mongoose";
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Applicant } from "../models/applicant.model.js";
import { Application } from "../models/application.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { JobProfile } from "../models/jobProfile.model.js";
import bcrypt from "bcrypt";

const MAX_RESUME_SIZE = 2 * 1024 * 1024;
const ACCEPTED_RESUME_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export const validateResumeFile = (file) => {
    if (!file) {
        return { valid: false, error: "Resume file is required." };
    }

    if (file.size > MAX_RESUME_SIZE) {
        return { valid: false, error: "Resume file is too large. Maximum size is 2MB." };
    }

    if (!ACCEPTED_RESUME_TYPES.includes(file.mimetype)) {
        return { valid: false, error: "Unsupported file type. Please upload PDF, DOC, or DOCX." };
    }

    return { valid: true };
};

export const createApplicant = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "Name, email, and password are required.");
    }

    if (name.trim() === "" || email.trim() === "" || password.trim() === "") {
        throw new ApiError(400, "Fields cannot be empty.");
    }


    const existingApplicant = await Applicant.findOne({ email });

    if (existingApplicant) {
        throw new ApiError(409, "Email already in use.");
    }

    const createdApplicant = await Applicant.create({
        name,
        email,
        passwordHash: password
    });

    const payload = {
        id: createdApplicant._id,
        role: "APPLICANT",
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    createdApplicant.refreshToken = refreshToken;
    await createdApplicant.save();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    const safeApplicant = {
        _id: createdApplicant._id,
        name: createdApplicant.name,
        email: createdApplicant.email,
        resumeURL: createdApplicant.resumeURL,
        createdAt: createdApplicant.createdAt,
    };


    return res.status(201).cookie("refreshToken", refreshToken, cookieOptions).json(
        new ApiResponse(
            201,
            { token: accessToken, applicant: safeApplicant },
            "Applicant signed up successfully."
        )
    );
});


export const canApplicantApplyToJob = (job) => {
    if (!job || job.isOpen === false) {
        return false;
    }

    return true;
};

export const validateResumeUrl = (resumeURL) => {
    if (!resumeURL || typeof resumeURL !== "string") {
        return false;
    }

    const trimmedValue = resumeURL.trim();

    if (!trimmedValue) {
        return false;
    }

    try {
        const parsed = new URL(trimmedValue);
        return ["http:", "https:"].includes(parsed.protocol);
    } catch {
        return false;
    }
};

export const applyToJob = asyncHandler(async (req, res) => {

    const { jobId } = req.params;
    const applicantId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new ApiError(400, "Invalid Job Id or Applicant Id");
    }

    const fetchedJobProfile = await JobProfile.findById(jobId);

    if (!fetchedJobProfile) {
        throw new ApiError(404, "JobProfile Not Found");
    }

    if (!canApplicantApplyToJob(fetchedJobProfile)) {
        throw new ApiError(400, "This job is currently closed for applications.");
    }

    const fetchedApplicant = await Applicant.findById(applicantId);

    if (!fetchedApplicant) {
        throw new ApiError(404, "Applicant Not Found");
    }

    const existingApplication = await Application.findOne({
        appliedby: applicantId,
        appliedto: jobId
    })

    if (existingApplication) {
        throw new ApiError(409, "Application Already Under Review.");
    }

    const newApplication = await Application.create(
        {
            appliedby: applicantId,
            appliedto: jobId,
            currentStageIndex: 0,
            terminalStatus: null,
            history: []
        }
    )

    newApplication.history.push(
        {
            action: "APPLIED_TO_JOB",
            performedbyRole: "APPLICANT",
            fromStageIndex: null,
            toStageIndex: 0
        }
    )
    await newApplication.save();

    fetchedApplicant.appliedApplications.push(newApplication._id);
    await fetchedApplicant.save();

    return res.status(201).json(
        new ApiResponse(201, newApplication, "Application Submitted Successfully.")
    )

})

export const getApplicantProfile = asyncHandler(async (req, res) => {
    const applicantId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new ApiError(400, "Invalid Applicant ID");
    }

    const applicant = await Applicant.findById(applicantId).select("-passwordHash -refreshToken");

    if (!applicant) {
        throw new ApiError(404, "Applicant not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, applicant, "Applicant profile fetched successfully.")
    );
});

export const updateApplicantProfile = asyncHandler(async (req, res) => {
    const applicantId = req.user.id;
    const { name, optionalContactInfo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new ApiError(400, "Invalid Applicant ID");
    }

    const applicant = await Applicant.findById(applicantId);

    if (!applicant) {
        throw new ApiError(404, "Applicant not found.");
    }

    if (name !== undefined) {
        if (typeof name !== "string" || name.trim() === "") {
            throw new ApiError(400, "Name must be a non-empty string.");
        }
        applicant.name = name.trim();
    }

    if (optionalContactInfo !== undefined) {
        applicant.optionalContactInfo = optionalContactInfo;
    }

    await applicant.save({ validateBeforeSave: false });

    const safeApplicant = await Applicant.findById(applicantId).select("-passwordHash -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, safeApplicant, "Applicant profile updated successfully.")
    );
});

export const updateApplicantResume = asyncHandler(async (req, res) => {
    const applicantId = req.user.id;
    const { resumeURL } = req.body;

    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new ApiError(400, "Invalid Applicant ID");
    }

    if (!validateResumeUrl(resumeURL)) {
        throw new ApiError(400, "Resume URL is required and must be a valid http/https URL.");
    }

    const applicant = await Applicant.findById(applicantId);

    if (!applicant) {
        throw new ApiError(404, "Applicant not found.");
    }

    applicant.resumeURL = resumeURL.trim();
    await applicant.save({ validateBeforeSave: false });

    const safeApplicant = await Applicant.findById(applicantId).select("-passwordHash -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, safeApplicant, "Applicant resume updated successfully.")
    );
});

export const uploadApplicantResume = asyncHandler(async (req, res) => {
    const applicantId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
        throw new ApiError(400, "Invalid Applicant ID");
    }

    if (!req.file) {
        throw new ApiError(400, "Resume file is required.");
    }

    const validation = validateResumeFile(req.file);

    if (!validation.valid) {
        throw new ApiError(400, validation.error);
    }

    const applicant = await Applicant.findById(applicantId);

    if (!applicant) {
        throw new ApiError(404, "Applicant not found.");
    }

    const uploadedResumeUrl = `/uploads/resumes/${req.file.filename}`;
    applicant.resumeURL = uploadedResumeUrl;
    await applicant.save({ validateBeforeSave: false });

    const safeApplicant = await Applicant.findById(applicantId).select("-passwordHash -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, safeApplicant, "Applicant resume uploaded successfully.")
    );
});