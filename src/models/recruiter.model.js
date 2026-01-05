import mongoose from 'mongoose';
import bcrypt from "bcrypt";

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
        select: false,
        required: true
    },

    role: {
        type: String,
        enum: ["ADMIN"],
        default: "ADMIN",
        immutable: true
    },


    refreshToken: {
        type: String,
        select: false,
    }
},
{timestamps: true})

recruiterSchema.pre('save', async function(){
    if(!this.isModified('passwordHash')) return;

    await bcrypt.hash(this.passwordHash, 10);
})

recruiterSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(password, this.passwordHash); // order matters always ! (password tocheck , password in document);
}


export const Recruiter = mongoose.model("Recruiter" , recruiterSchema);