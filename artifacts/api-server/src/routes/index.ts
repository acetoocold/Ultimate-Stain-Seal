import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import projectsRouter from "./projects";
import diagnosesRouter from "./diagnoses";
import invoicesRouter from "./invoices";
import jobsRouter from "./jobs";
import materialsRouter from "./materials";
import documentsRouter from "./documents";
import activityRouter from "./activity";
import settingsRouter from "./settings";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import glideRouter from "./glide";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(projectsRouter);
router.use(diagnosesRouter);
router.use(invoicesRouter);
router.use(jobsRouter);
router.use(materialsRouter);
router.use(documentsRouter);
router.use(activityRouter);
router.use(settingsRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(glideRouter);

export default router;
