import mongoose from 'mongoose';

const recruiterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true 
    },

    CompanyName: {
        type: String,
        required: true,
        trim: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["ADMIN"],
        default: "ADMIN",
        immutable: true
    }
},
{timestamps: true})


export const Recruiter = mongoose.model("Recruiter" , recruiterSchema);