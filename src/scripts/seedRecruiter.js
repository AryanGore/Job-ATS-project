import mongoose from "mongoose";
import dotenv from "dotenv";

import bcrypt from "bcrypt";

import { Recruiter } from "../models/recruiter.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config({
    path: './.env',
});


const seedRecruiter = async () => {
    // console.log(`${process.env.MONGODB_URI}/${DB_NAME}`)
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Datavase connected.");

        const existingRecruiter = await Recruiter.findOne({ email: "admin@company.com" });

        

        if(existingRecruiter){
            console.log("Recruiter Already exists, please ask Authorities for credentials.");
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash("admin@040", 10);

        // console.log("before creation hash : ", passwordHash);

        await Recruiter.create({
            name: "companyAdminAuthorized",
            email: "admin@company.com",
            CompanyName: "company",
            passwordHash,
        });

        // const newRecruiter = await Recruiter.findOne({ email: "admin@company.com" }).select("+passwordHash");

        // console.log("after creation hash : ", newRecruiter.passwordHash);

        // console.log("Recruiter Seeded Successfully.");

    } catch (error) {
        console.error("Seeding failed : ", error);
        process.exit(1);        
    }
}


await seedRecruiter();