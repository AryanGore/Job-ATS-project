import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const createJob = asyncHandler(async (req , res)=> {
    //get data from Request.
    //validate required fields.
    //create JOv in DV
    //return API response

    const {title , description , jobStages, numberOfPositions, skillReq} = req.body;

    if(!title || !description || !Array.isArray(jobStages) || jobStages.length === 0 || !numberOfPositions){
        throw new ApiError(400, "Please input required fields and atleast one Stage in job stages.");
    }

    const createdJob = await JobProfile.create({
        title: title,
        description: description,
        jobStages: jobStages,
        numberOfPositions,
        skillReq
    })

    return res.status(201).json(
        new ApiResponse(201 , createdJob, "new Job Created")
    )

})


export const getAllJobs = asyncHandler(async(req , res) => {

    const job = await JobProfile.find({}).sort({createdAt: -1});

    return res.status(200).json(
        new ApiResponse(200 , job, "All job profiles fetched.")
    )
})

export const getJobbyId = asyncHandler(async(req, res)=> {

    //get Id from params.
    //Validate ObjectId.
    //fetch job
    //handle Job not found.
    //return response

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid Job ID");
    }

    const job = await JobProfile.findById(id);

    if(!job){
        throw new ApiError(400 , "Job Profile Not Found.");
    }

    return res.status(200).json(
        new ApiResponse(200 , job, "Job found Successfully.")
    )

})

