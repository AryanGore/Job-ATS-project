import { Router } from "express";
import { advanceApplicationStage, rejectApplication, withdrawApplication , getAllApplications 
    , getSingleApplication,
    hireApplication
} from '../controller/application.controller.js';

const router = Router();

//endpoints
router.patch('/:id/advance', advanceApplicationStage); //recruiter Action.
router.patch('/:id/reject', rejectApplication); //recruiter Action.
router.patch('/:id/withdraw', withdrawApplication); // Applicant action.
router.patch('/:id/hire', hireApplication);

router.get('/', getAllApplications);
router.get('/:id', getSingleApplication); 

export default router;