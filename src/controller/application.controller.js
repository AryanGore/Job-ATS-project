import mongoose, { mongo } from "mongoose";
import { Application } from "../models/application.model.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js';
import { FSM } from "../utils/applicationFsm.js";

const assertApplicationActionAllowed = (application, actionName) => {
    if (!application) {
        throw new ApiError(404, "Application Not Found.");
    }

    if (application.terminalStatus !== null) {
        throw new ApiError(400, `Application already terminal; ${actionName} is not allowed.`);
    }
};

export const advanceApplicationStage = asyncHandler(async (req, res) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Application ID");
    }

    const application = await Application.findById(id);

    assertApplicationActionAllowed(application, "advance");

    const appliedJob = await JobProfile.findById(application.appliedto);

    if (!appliedJob) {
        throw new ApiError(404, "Applied Job Profile Not Found.");
    }

    if (!Array.isArray(appliedJob.jobStages) || appliedJob.jobStages.length === 0) {
        throw new ApiError(400, "This job has no defined stages for progression.");
    }

    if (application.currentStageIndex >= appliedJob.jobStages.length) {
        throw new ApiError(400, "Application has already reached the end of the job process.");
    }

    const { nextStageIndex, terminalStatus } = FSM({
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


export const rejectApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Application ID");
    }

    const application = await Application.findById(id);

    assertApplicationActionAllowed(application, "reject");

    const { nextStageIndex, terminalStatus } = FSM({
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

export const withdrawApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Application Id.");
    }

    const application = await Application.findById(id);

    assertApplicationActionAllowed(application, "withdraw");

    const applicantId = req.user.id;
    if (application.appliedby.toString() !== applicantId) {
        throw new ApiError(403, "You are not authorized to withdraw this application.");
    }

    const prevStageIndex = application.currentStageIndex;

    const { terminalStatus } = FSM({
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

export const hireApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Application ID");
    }

    const application = await Application.findById(id);

    assertApplicationActionAllowed(application, "hire");

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

export const getAllApplications = asyncHandler(async (req, res) => {

    const filter = {};
    if (req.user.role === "APPLICANT") {
        filter.appliedby = req.user.id;
    }

    const applications = await Application.find(filter).populate('appliedby').populate('appliedto');

    return res.status(200).json(
        new ApiResponse(200, applications, "Applications fetched.")
    );
})

export const getSingleApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Application Id");
    }

    const application = await Application.findById(id).populate('appliedby').populate('appliedto');

    if (!application) {
        throw new ApiError(404, "Application Not Found.");
    }

    // Security check for Applicants
    if (req.user.role === "APPLICANT" && application.appliedby._id.toString() !== req.user.id) {
        throw new ApiError(403, "You are not authorized to view this application.");
    }

    return res.status(200).json(
        new ApiResponse(200, application, "Application Fetched Successfully")
    )
})


export const getFilteredApplication = asyncHandler(async (req, res) => {
    const { terminalStatus, jobId, applicantId } = req.query;

    const filter = {};
    if (terminalStatus) filter.terminalStatus = terminalStatus;
    if (jobId) filter.appliedto = jobId;

    // Enforcement for Applicants
    if (req.user.role === "APPLICANT") {
        filter.appliedby = req.user.id;
    } else if (applicantId) {
        filter.appliedby = applicantId;
    }

    const filteredApplications = await Application.find(filter).populate('appliedby').populate('appliedto');

    return res.status(200).json(
        new ApiResponse(200, filteredApplications, "Filtered Applications Fetched Successfully.")
    )

})

