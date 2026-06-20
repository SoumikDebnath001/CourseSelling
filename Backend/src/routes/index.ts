import { Router } from "express";
import authRoutes from "./auth";
import categoryRoutes from "./category";
import courseRoutes from "./course";
import moduleRoutes from "./module";
import topicRoutes from "./topic";
import enrollmentRoutes from "./enrollment";
import progressRoutes from "./progress";
import progressionRoutes from "./progression";
import commentRoutes from "./comment";
import testRoutes from "./test";
import ratingRoutes from "./rating";
import adminRoutes from "./admin";
import contactRoutes from "./contact";
import settingsRoutes from "./settings";
import physicalAssessmentRoutes from "./physicalAssessment";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/courses", courseRoutes);
router.use("/modules", moduleRoutes);
router.use("/topics", topicRoutes);
router.use("/enroll", enrollmentRoutes);
router.use("/progress", progressRoutes);
router.use("/progression", progressionRoutes);
router.use("/comments", commentRoutes);
router.use("/tests", testRoutes);
router.use("/ratings", ratingRoutes);
router.use("/admin", adminRoutes);
router.use("/contact", contactRoutes);
router.use("/settings", settingsRoutes);
router.use("/physical-assessments", physicalAssessmentRoutes);

export default router;
