import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
import { validateRequiredEnv } from './config/env.js';

dotenv.config({
    path: './.env'
})

try {
    validateRequiredEnv();
} catch (error) {
    console.error('Environment validation failed:', error.message);
    process.exit(1);
}

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running at PORT : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log(`MongoDB connection Failed !!`, err);
})