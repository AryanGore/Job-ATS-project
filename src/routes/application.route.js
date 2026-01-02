import { Router } from "express";
import { advanceApplicationStage, rejectApplication, withdrawApplication } from '../controller/application.controller.js';

const router = Router();

//endpoints
router.patch('/:id/advance', advanceApplicationStage); //recruiter Action.
router.patch('/:id/reject', rejectApplication); //recruiter Action.
router.patch('/:id/withdraw', withdrawApplication); // Applicant action.

export default router;