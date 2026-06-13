import { Router } from "express";
import { enroll, myEnrolledCourses, myTransactions } from "../controllers/enrollment";
import { requireAuth, requireStudent } from "../middleware/auth";

const router = Router();

router.get("/my-courses", requireAuth, requireStudent, myEnrolledCourses);
router.get("/transactions", requireAuth, requireStudent, myTransactions);
router.post("/:courseId", requireAuth, requireStudent, enroll);

export default router;
