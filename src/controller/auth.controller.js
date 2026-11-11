import mongoose from "mongoose";
import { Applicant } from "../models/applicant.model.js";
import { Recruiter } from "../models/recruiter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { Application } from "../models/application.model.js";

export const applicantSignup = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "All fields are required.");
    }

    if (name.trim() === "" || email.trim() === "" || password.trim() === "") {
        throw new ApiError(400, "Fields cannot be empty.");
    }

    const existingApplicant = await Applicant.findOne({ email });

    if (existingApplicant) {
        throw new ApiError(400, "Applicant with same Email Already exists.");
    }

    const applicant = await Applicant.create({
        name,
        email,
        passwordHash: password
    })

    const payload = {
        id: applicant._id,
        role: "APPLICANT"
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    applicant.refreshToken = refreshToken;
    await applicant.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }

    const responseApplicant = await Applicant.findById(applicant._id).select("-passwordHash -refreshToken");

    return res.status(201).cookie("refreshToken", refreshToken, cookieOptions).json(
        new ApiResponse(201, {
            token: accessToken,
            applicant: responseApplicant
        }, "Applicant Signed Up successfully.")
    )
})

export const recruiterSignup = asyncHandler(async (req, res) => {
    const { name, email, password, CompanyName } = req.body;

    if (!name || !email || !password || !CompanyName) {
        throw new ApiError(400, "Name, email, password and company name are required.");
    }

    if (name.trim() === "" || email.trim() === "" || password.trim() === "" || CompanyName.trim() === "") {
        throw new ApiError(400, "Fields cannot be empty.");
    }

    const existingRecruiter = await Recruiter.findOne({ email });

    if (existingRecruiter) {
        throw new ApiError(409, "Recruiter with same email already exists.");
    }

    const recruiter = await Recruiter.create({
        name,
        email,
        CompanyName,
        passwordHash: password
    });

    const payload = {
        id: recruiter._id,
        role: "ADMIN"
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    recruiter.refreshToken = refreshToken;
    await recruiter.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    const safeRecruiter = {
        _id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email,
        CompanyName: recruiter.CompanyName
    };

    return res.status(201).cookie("refreshToken", refreshToken, cookieOptions).json(
        new ApiResponse(201, {
            token: accessToken,
            recruiter: safeRecruiter
        }, "Recruiter signed up successfully.")
    );
});

export const applicantLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "please enter email and password.");
    }

    const applicant = await Applicant.findOne({ email }).select("+passwordHash");

    if (!applicant) {
        throw new ApiError(400, "Invalid email or password");
    }
    const isValidPassword = await applicant.comparePassword(password);

    if (!isValidPassword) {
        throw new ApiError(401, "Email or password is invalid.");
    }

    const payload = {
        id: applicant._id,
        role: "APPLICANT"
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    applicant.refreshToken = refreshToken;
    await applicant.save();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }

    const safeApplicant = await Applicant.findById(applicant._id).select("-passwordHash -refreshToken");

    return res.status(200).cookie("refreshToken", refreshToken, cookieOptions).json(
        new ApiResponse(200, {
            token: accessToken,
            applicant: safeApplicant
        },
            "Applicant Logged in Successfully."
        )
    )
})

export const refreshApplicantAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh Token Missing");
    }

    let decoded;

    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or Expired Refresh Token.");
    }

    const applicant = await Applicant.findById(decoded.id).select("+refreshToken");


    if (!applicant || applicant.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is Invalid or Revoked.");
    }

    const payload = {
        id: applicant._id,
        role: "APPLICANT"
    }

    const newAccessToken = generateAccessToken(payload);

    return res.status(200).json(
        new ApiResponse(200, { token: newAccessToken }, "Access Token refreshed Successfully.")
    )
})

export const applicantLogout = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(200).json(
            new ApiResponse(200, {}, "Applicant Logged Out Successfully.")
        )
    }

    const applicant = await Applicant.findOne({ refreshToken: incomingRefreshToken });

    if (applicant) {
        applicant.refreshToken = null;
        await applicant.save({ validateBeforeSave: false });
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Applicant Logged Out Successfully")
    )
})



export const getRecruiterProfile = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
        throw new ApiError(400, "Invalid Recruiter ID");
    }

    const recruiter = await Recruiter.findById(recruiterId).select("-passwordHash -refreshToken");

    if (!recruiter) {
        throw new ApiError(404, "Recruiter not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, recruiter, "Recruiter profile fetched successfully.")
    );
});

export const getRecruiterDashboardStats = asyncHandler(async (req, res) => {
    const recruiterId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(recruiterId)) {
        throw new ApiError(400, "Invalid Recruiter ID");
    }

    const recruiter = await Recruiter.findById(recruiterId);

    if (!recruiter) {
        throw new ApiError(404, "Recruiter not found.");
    }

    const [totalJobs, totalApplications, openJobs, totalApplicants] = await Promise.all([
        JobProfile.countDocuments(),
        Application.countDocuments(),
        JobProfile.countDocuments({ isOpen: true }),
        Applicant.countDocuments()
    ]);

    const stageSummary = await Application.aggregate([
        {
            $group: {
                _id: "$terminalStatus",
                count: { $sum: 1 }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            recruiter: {
                _id: recruiter._id,
                name: recruiter.name,
                email: recruiter.email,
                CompanyName: recruiter.CompanyName
            },
            stats: {
                totalJobs,
                openJobs,
                totalApplications,
                totalApplicants,
                statusSummary: stageSummary
            }
        }, "Recruiter dashboard stats fetched successfully.")
    );
});

export const recruiterLogin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) throw new ApiError(400, "Please enter email and password.");

    const recruiter = await Recruiter.findOne({ email }).select("+passwordHash");

    if (!recruiter) throw new ApiError(401, "Invalid email");

    const isValidPassword = await recruiter.comparePassword(password);

    if (!isValidPassword) throw new ApiError(401, "Invalid email or password");

    const payload = { id: recruiter._id, role: "ADMIN" };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    recruiter.refreshToken = refreshToken;
    await recruiter.save({ validateBeforeSave: false });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    const safeRecruiter = {
        _id: recruiter._id,
        name: recruiter.name,
        email: recruiter.email
    };

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                { token: accessToken, recruiter: safeRecruiter },
                "Recruiter logged in successfully."
            )
        );
});

export const refreshRecruiterAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) throw new ApiError(401, "Refresh token missing");

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
        // console.log("API response : ",incomingRefreshToken);

        // const recruiter = await Recruiter.findOne({_id: "695be8199acc3af9e1ea25b0"}).select("+refreshToken");

        // console.log("Datavase response : ", recruiter.refreshToken); // debugging.

        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const recruiter = await Recruiter.findById(decoded.id).select("+refreshToken");

    if (!recruiter || recruiter.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is invalid or revoked");
    }

    const payload = { id: recruiter._id, role: "ADMIN" };
    const newAccessToken = generateAccessToken(payload);

    return res.status(200).json(
        new ApiResponse(
            200,
            { token: newAccessToken },
            "Access token refreshed successfully"
        )
    );
});


export const recruiterLogout = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
        return res.status(200).json(new ApiResponse(200, {}, "Recruiter logged out successfully."));
    }

    const recruiter = await Recruiter.findOne({ refreshToken: incomingRefreshToken });
    if (recruiter) {
        recruiter.refreshToken = null;
        await recruiter.save({ validateBeforeSave: false });
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    return res.status(200).json(
        new ApiResponse(200, {}, "Recruiter logged out successfully.")
    );
});


