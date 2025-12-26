import { Router } from 'express';
import { createJob, getAllJobs, getJobbyId } from '../controller/job.controller.js';

const router = Router();

router.post("/" , createJob);
router.get("/", getAllJobs);
router.get("/:id", getJobbyId);

export default router;