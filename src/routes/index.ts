import express from 'express';
import authRouter from './auth.routes';
import uploadRouter from './upload.routes';
import permissionRouter from './permission.routes';
import customerRouter from './customer.routes';
import loanAppRouter from './loan-application.routes';
import otpRouter from './otp.routes';
import userRouter from './user.routes';
import productTypeRouter from './product_type.routes'

const router = express.Router();


router.use('/auth', authRouter);

router.use('/upload', uploadRouter);

router.use('/permissions', permissionRouter);

router.use('/customer', customerRouter);

router.use('/loan-application', loanAppRouter);

router.use('/otp', otpRouter);

router.use('/users', userRouter);

router.use('/productTypes',productTypeRouter);


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
