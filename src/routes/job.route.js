import { Router } from 'express';
import { createJob, getAllJobs, getJobbyId } from '../controller/job.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware.js';

const router = Router();

router.get("/", getAllJobs);
router.get("/:id", getJobbyId);
router.post("/", verifyJwt, authorizeRoles("ADMIN"), createJob);

//update and delete coming soon.

export default router;