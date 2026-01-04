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
        required: true,
        select: false
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

recruiterSchema.pre('save', async function(next){
    if(!this.isModified('passwordHash')) return next();

    await bcrypt.hash(this.passwordHash, 10);
    next();
})

recruiterSchema.methods.comparePassword = async function(password){
    return bcrypt.compare(this.passwordHash, password);
}


export const Recruiter = mongoose.model("Recruiter" , recruiterSchema);