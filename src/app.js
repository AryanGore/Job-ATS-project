import express, { urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(urlencoded({extended: true , limit: "16kb"}));
app.use(express.static("public"))
app.use(cookieParser());



//routes here.

app.use(errorHandler);

export { app };