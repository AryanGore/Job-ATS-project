import mongoose from 'mongoose';

const applicantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true
        },

        resumeURL: {
            type: String
        },

        appliedApplications: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Application"
            }
        ],

        optionalContactInfo: {
            type: Object
        }


    },
    { timestamps: true }
)

export const Applicant = mongoose.model("Applicant", applicantSchema);