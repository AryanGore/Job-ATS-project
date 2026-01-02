import mongoose, { mongo } from "mongoose";
import { Application } from "../models/application.model.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiResponse} from '../utils/ApiResponse.js';
import { FSM } from "../utils/applicationFsm.js";

export const advanceApplicationStage = asyncHandler(async(req , res) => {

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
        throw new ApiError(404, "Applied Job Profile Not Found.");
    }

    const {nextStageIndex, terminalStatus} = FSM({
        currentStageIndex: application.currentStageIndex,
        jobStages: appliedJob.jobStages,
        terminalStatus: application.terminalStatus,
        action: "NEXT_STAGE"
    })

    application.history.push({
        action: "STAGE_MOVED",
        performedbyRole: "ADMIN",
        fromStageIndex: application.currentStageIndex,
        toStageIndex: nextStageIndex
    });

    application.currentStageIndex = nextStageIndex;
    application.terminalStatus = terminalStatus;

    await application.save();

    return res.status(200).json(
        new ApiResponse(200, application, "Application Advanced to Next Stage.")
    );

});


export const rejectApplication = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid Application ID");
    }

    const application = await Application.findById(id);

    if(!application){
        throw new ApiError(400, "Application Not Found!");
    }

    const {nextStageIndex, terminalStatus} = FSM({
        currentStageIndex: application.currentStageIndex,
        terminalStatus: application.terminalStatus,
        action: "REJECT"
    })

    application.history.push({
        action: "REJECTED",
        performedbyRole: "ADMIN",
        fromStageIndex: application.currentStageIndex,
        toStageIndex: null
    })

    application.currentStageIndex = nextStageIndex;
    application.terminalStatus = terminalStatus;

    await application.save();

    return res.status(200).json(
        new ApiResponse(200, application, "Application Rejected Successfully.")
    );

});

export const withdrawApplication = asyncHandler(async(req, res) => {
    const { id } = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid Application Id.");
    }

    const application = await Application.findById(id);

    if(!application){
        throw new ApiError(404, "Application Not found.");
    }

    if(application.terminalStatus !== null){
        throw new ApiError(400, "Application Already in terminal State");
    }

    const prevStageIndex = application.currentStageIndex;

    const {terminalStatus} = FSM({
        currentStageIndex: application.currentStageIndex,
        terminalStatus: application.terminalStatus,
        action: "WITHDRAW"
    })

    application.terminalStatus = terminalStatus;

    
    application.history.push({
        action: "WITHDRAWN",
        performedbyRole: "APPLICANT",
        fromStageIndex: prevStageIndex,
        toStageIndex: null,
    })
    
    await application.save();

    return res.status(200).json(
        new ApiResponse(200, application, "Application Withdrawn Successfully.")
    )

})

export const hireApplication = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ApiError(400, "Invalid Application ID");
    }

    const application = await Application.findById(id);

    if(!application){
        throw new ApiError(404, "Application Not Found.")
    }

    if(application.terminalStatus !== null){
        throw new ApiError(400, "Application already at terminal State cannot hire.");
    }

    const { terminalStatus } = FSM({
        currentStageIndex: application.currentStageIndex,
        terminalStatus: application.terminalStatus,
        action: "HIRE"
    });

    application.history.push({
        action: "HIRED",
        performedbyRole: "ADMIN",
        fromStageIndex: application.currentStageIndex,
        toStageIndex: null
    });

    application.terminalStatus = terminalStatus;

    await application.save();

    return res.status(200).json(
        new ApiResponse(200, application, "Application hired Successfully.")
    )

})