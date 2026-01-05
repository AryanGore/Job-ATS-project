import { Router } from "express";
import { advanceApplicationStage, rejectApplication, withdrawApplication , getAllApplications 
    , getSingleApplication,
    hireApplication,
    getFilteredApplication
} from '../controller/application.controller.js';

import { verifyJwt } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.middleware.js";

const router = Router();

//endpoints
router.get('/filter', verifyJwt, authorizeRoles("ADMIN", "APPLICANT"), getFilteredApplication);
router.patch('/:id/advance',verifyJwt, authorizeRoles("ADMIN"), advanceApplicationStage); //recruiter Action.
router.patch('/:id/reject',verifyJwt, authorizeRoles("ADMIN"), rejectApplication); //recruiter Action.
router.patch('/:id/withdraw',verifyJwt, authorizeRoles("APPLICANT"), withdrawApplication); // Applicant action.
router.patch('/:id/hire',verifyJwt, authorizeRoles("ADMIN"), hireApplication);

router.get('/',verifyJwt, authorizeRoles("ADMIN" , "APPLICANT"), getAllApplications);
router.get('/:id',verifyJwt, authorizeRoles("APPLICANT", "ADMIN"), getSingleApplication); 


export default router;