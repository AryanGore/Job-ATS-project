import mongoose from "mongoose";
import { Application } from "../models/application.model.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from '../utils/ApiResponse.js'

const moveApplicationStage = asyncHandler(async(req , res) => {
    // get ID from params
    // validate ID.
    // fetch application from the Database.
    // check if available Application.
    // fetch the JobProfile it is applied to.
    // get the string for next Index

    const {id} = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400 , "Invalid Application ID");
    }

    const application = await Application.findById(id);

    if(!application){
        throw new ApiError(404 , "Job Application Not Found.")
    }

    const appliedJob = await JobProfile.findById(application.appliedto);

    if(!appliedJob){
        throw new ApiError(404, "Applied JobProfile Not found");
    }

    const {toStageIndex} = req.body;

    if(application.terminalStatus !== null){
        throw new ApiError(400, "Cannot Move Any Further, this might be the final stage.")
    }

    if(toStageIndex >= appliedJob.jobStages.length){
        throw new ApiError(400 , "No Next Stage Available.");
    }

    if(toStageIndex !== application.currentStageIndex + 1){
        throw new ApiError(400 , "You can move to only Next Stage. This might be the final Stage.");
    }

    application.history.push({
        action: "STAGE_MOVED",
        performedbyRole: "ADMIN",
        fromStageIndex: application.currentStageIndex,
        toStageIndex: toStageIndex
    });

    await application.save();

    return res.status(200).json(
        new ApiResponse(200 , application, "Moved Application to Next Stage")
    )
})