import { Router } from 'express';
import { createJob } from '../controller/job.controller.js';

const router = Router();

router.post("/" , createJob);

export default router;