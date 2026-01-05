import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJwt = asyncHandler(async(req, res, next) => {

    const authHeader = req.headers.authorization;

    if(!authHeader){
        throw new ApiError(401, "Unauthorized: Authorization Header Missing.");
    }

    if(!authHeader.startsWith("Bearer ")){
        throw new ApiError(401, "Invalid Authorization Format.");
    }

    const token = authHeader.split(" ")[1];

    if(!token){
        throw new ApiError(401, "Token Missing");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role
        }
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or Expired Token.");
    }

})