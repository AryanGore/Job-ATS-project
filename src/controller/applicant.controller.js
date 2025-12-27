import mongoose from "mongoose";
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Applicant } from "../models/applicant.model.js";
import { Application } from "../models/application.model.js";

export const createApplicant = asyncHandler(async(req , res) => {
    //get name, email , password (in db :  passwordHash) storing password raw for now.
    //validate if all the above fields are present or not
    //create Applicant in DB
    // return response.

    const {name , email , passwordHash} = req.body;

    if(!name || !email || !passwordHash){
        throw new ApiError(400 , "name, email and password is required.");
    }

    if(name.trim() === "" || email.trim() === "" || passwordHash.trim() === ""){
        throw new ApiError(400 , "Fields Cannot be empty");
    }

    const createdApplicant = await Applicant.create(
        {
            name,
            email,
            passwordHash
        }
    )

    const applicantResponse = {
        _id: createdApplicant._id,
        name: createdApplicant.name,
        email: createdApplicant.email,
        resumeURL: createdApplicant.resumeURL,
        createdAt: createdApplicant.createdAt
    }

    return res.status(201).json(
        new ApiResponse(201, applicantResponse, "Applicant created Successfully.")
    )
})


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