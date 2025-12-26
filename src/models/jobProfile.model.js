import mongoose from 'mongoose';

const jobStageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
    }
    ,
    {
        _id: false
    }
);


const jobProfileSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        skillReq: [
            {
                type: String,
                trim: true
            }
        ],

        description: {
            type: String,
            required: true,
        },

        jobStages: {
            type: [jobStageSchema],
            required: true
        },

        numberOfPositions: {
            type: Number,
            required: true,
            min: 1
        },

        isOpen: {
            type: Boolean,
            default: true
        }
    },

    {
        timestamps: true
    }
)

export const JobProfile = mongoose.model("JobProfile", jobProfileSchema);
