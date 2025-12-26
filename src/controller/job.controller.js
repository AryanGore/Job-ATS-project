import { ApiError } from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { JobProfile } from "../models/jobProfile.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

