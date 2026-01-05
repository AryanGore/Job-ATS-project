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
            select: false,
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
        },

        refreshToken: {
            type: String,
            select: false
        }


    },
    { timestamps: true }
)

applicantSchema.pre('save', async function() {
    if(!this.isModified('passwordHash')) return;

    if(!this.passwordHash) return;
    // console.log("Value to hash:", this.passwordHash);
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    // next(); // caused next is not a function error.
})

applicantSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(password, this.passwordHash);
}

export const Applicant = mongoose.model("Applicant", applicantSchema);