import mongoose from "mongoose";

const historyScehma = new mongoose.Model(
    {
        action: {
            type: String,
            required: true
        },

        performedbyRole: {
            type: String,
            enum: ["ADMIN" , "APPLICANT"],
            required: true
        },

        fromStageIndex: {
            type: Number,
        },

        toStageIndex: {
            type: Number
        },

        timestamp: {
            type: Date,
            default: Date.now()
        }
    },

    { _id: false}
)

const applicationSchema = new mongoose.Schema(
    {
        appliedby: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Applicant",
            required: true
        },

        appliedto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobProfile",
            required: true
        },

        currentStageIndex: {
            type: Number,
            required: true,
            default: 0
        },

        terminalStatus: {
            type: String,
            enum: ["HIRED", "REJECTED", "WITHDRAWN"],
            default: null
        },

        history: [historyScehma]

    },

    { timestamps: true }
)


export const Application = mongoose.model("Application", applicationSchema);