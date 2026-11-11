import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const validateJobPayload = (payload = {}) => {
    const { title, description, jobStages, numberOfPositions } = payload;
    const errors = [];

    if (!title || typeof title !== "string" || title.trim() === "") {
        errors.push("Title is required.");
    }

    if (!description || typeof description !== "string" || description.trim() === "") {
        errors.push("Description is required.");
    }

    if (!Array.isArray(jobStages) || jobStages.length === 0) {
        errors.push("At least one job stage is required.");
    }

    if (!Number.isInteger(numberOfPositions) || numberOfPositions < 1) {
        errors.push("Number of positions must be a positive integer.");
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

export const createJob = asyncHandler(async (req, res) => {
    const { title, description, jobStages, numberOfPositions, skillReq } = req.body;

    const validation = validateJobPayload({ title, description, jobStages, numberOfPositions });

    if (!validation.valid) {
        throw new ApiError(400, "Job validation failed.", validation.errors);
    }

    const createdJob = await JobProfile.create({
        title: title.trim(),
        description: description.trim(),
        jobStages: jobStages.map((stage) => ({ name: stage.name.trim() })),
        numberOfPositions,
        skillReq: Array.isArray(skillReq) ? skillReq.map((skill) => skill.trim()) : []
    })

    return res.status(201).json(
        new ApiResponse(201, createdJob, "new Job Created")
    )

})


export const getAllJobs = asyncHandler(async (req, res) => {

    const job = await JobProfile.find({}).sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, job, "All job profiles fetched.")
    )
})

export const getJobbyId = asyncHandler(async (req, res) => {

    //get Id from params.
    //Validate ObjectId.
    //fetch job
    //handle Job not found.
    //return response

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Job ID");
    }

    const job = await JobProfile.findById(id);

    if (!job) {
        throw new ApiError(400, "Job Profile Not Found.");
    }

    return res.status(200).json(
        new ApiResponse(200, job, "Job found Successfully.")
    )

})

export const updateJob = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, jobStages, numberOfPositions, skillReq, isOpen } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Job ID");
    }

    const job = await JobProfile.findById(id);

    if (!job) {
        throw new ApiError(404, "Job Profile Not Found.");
    }

    if (title !== undefined) {
        if (typeof title !== "string" || title.trim() === "") {
            throw new ApiError(400, "Title must be a non-empty string.");
        }
        job.title = title.trim();
    }

    if (description !== undefined) {
        if (typeof description !== "string" || description.trim() === "") {
            throw new ApiError(400, "Description must be a non-empty string.");
        }
        job.description = description.trim();
    }

    if (jobStages !== undefined) {
        const validation = validateJobPayload({
            title: job.title,
            description: job.description,
            jobStages,
            numberOfPositions: job.numberOfPositions
        });

        if (!validation.valid) {
            throw new ApiError(400, "Job stage validation failed.", validation.errors);
        }

        job.jobStages = jobStages.map((stage) => ({ name: stage.name.trim() }));
    }

    if (numberOfPositions !== undefined) {
        if (!Number.isInteger(numberOfPositions) || numberOfPositions < 1) {
            throw new ApiError(400, "Number of positions must be a positive integer.");
        }
        job.numberOfPositions = numberOfPositions;
    }

    if (skillReq !== undefined) {
        job.skillReq = Array.isArray(skillReq) ? skillReq.map((skill) => skill.trim()) : [];
    }

    if (isOpen !== undefined) {
        if (typeof isOpen !== "boolean") {
            throw new ApiError(400, "isOpen must be a boolean value.");
        }
        job.isOpen = isOpen;
    }

    await job.save();

    return res.status(200).json(
        new ApiResponse(200, job, "Job Profile Updated Successfully.")
    );
});

export const deleteJob = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Job ID");
    }

    const job = await JobProfile.findByIdAndDelete(id);

    if (!job) {
        throw new ApiError(404, "Job Profile Not Found.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Job Profile Deleted Successfully.")
    );
});

