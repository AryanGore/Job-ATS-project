import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.middleware.js';

import jobRoutes from './routes/job.route.js';
import authRoutes from './routes/auth.route.js';
import applicantRoutes from './routes/applicant.route.js';
import applicationRoutes from './routes/application.route.js';

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS policy violation'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
}));

app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"))
app.use(cookieParser());

//routes here.
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "ATS backend is healthy.",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/applicants", applicantRoutes);
app.use("/api/v1/applications", applicationRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
        errors: []
    });
});

app.use(errorHandler);

export { app };