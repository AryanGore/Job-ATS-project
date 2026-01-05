import mongoose from "mongoose";
import  asyncHandler  from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Applicant } from "../models/applicant.model.js";
import { Application } from "../models/application.model.js";
import { generateAccessToken,generateRefreshToken } from "../utils/token.js";

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


export const applyToJob = asyncHandler( async(req, res)=> {

    const { jobId } = req.params;
    const { applicantId } = req.body;

    if(!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(applicantId)){
        throw new ApiError(400, "Invalid Job Id or Applicant Id");
    }

    const fetchedJobProfile = await JobProfile.findById(jobId);

    if(!fetchedJobProfile){
        throw new ApiError(404, "JobProfile Not Found");
    }

    const fetchedApplicant = await Applicant.findById(applicantId);

    if(!fetchedApplicant){
        throw new ApiError(404, "Applicant Not Found");
    }

    const existingApplication = await Application.findOne({
        appliedby: applicantId,
        appliedto: jobId
    })

    if(existingApplication){
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