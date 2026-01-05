import { ApiError } from "../utils/ApiError.js";
import  asyncHandler  from "../utils/asyncHandler.js";

export const authorizeRoles = (...allowedRoles) => 
    asyncHandler( (req, res, next) => {
        if(!req.user || !allowedRoles.includes(req.user.role)){
            throw new ApiError(403, "UnAuthorized Action.")
        }

        next();
    }
);