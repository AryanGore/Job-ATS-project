import mongoose from 'mongoose';
import bcrypt from "bcrypt";

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
            required: true,
            select: false
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
        },

        refreshToken: {
            type: String,
            select: false
        }


    },
    { timestamps: true }
)

applicantSchema.pre('save', async function(next) {
    if(!this.isModified('passwordHash')) return next();

    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    next();
})

applicantSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(password, this.passwordHash);
}

export const Applicant = mongoose.model("Applicant", applicantSchema);