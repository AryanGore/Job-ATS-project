import { Router } from 'express';
import { createJob, getAllJobs, getJobbyId, updateJob, deleteJob } from '../controller/job.controller.js';
import { verifyJwt } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/authorizeRoles.middleware.js';

const router = Router();

router.get("/", verifyJwt, getAllJobs);
router.get("/:id", verifyJwt, getJobbyId);
router.post("/", verifyJwt, authorizeRoles("ADMIN"), createJob);

router.patch("/:id", verifyJwt, authorizeRoles("ADMIN"), updateJob);
router.delete("/:id", verifyJwt, authorizeRoles("ADMIN"), deleteJob);

export default router;