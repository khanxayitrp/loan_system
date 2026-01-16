import express from 'express';
import authRouter from './auth.routes';
import uploadRouter from './upload.routes';

const router = express.Router();


router.use('/auth', authRouter);

router.use('/upload', uploadRouter)
// router.use(User);
// // router.use('/employees', Employee);
// router.use(Employee);
// router.use(Position);
// router.use(Department);
// router.use(LeaveType);
// router.use(LeaveApplication);
// router.use(LeaveApprover);
// router.use(checkIn);
// router.use(AttendanceConfig);


export default router;
