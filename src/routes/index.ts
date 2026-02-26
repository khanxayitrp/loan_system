import express from 'express';
import authRouter from './auth.routes';
import uploadRouter from './upload.routes';
import permissionRouter from './permission.routes';
import customerRouter from './customer.routes';
import loanAppRouter from './loan-application.routes';
import otpRouter from './otp.routes';
import userRouter from './user.routes';
import productTypeRouter from './product_type.routes';
import partnerRouter from './partner.routes';
import productRouter from './product.routes';
import imageGalleryRotuer from './product_gallery.routes'
import custLocationRotuer from './customerLocation.routes'
import proposalRouter from './proposal.routes'
import pdfRouter from './pdf.routes'

const router = express.Router();


router.use('/auth', authRouter);

router.use('/upload', uploadRouter);

router.use('/permissions', permissionRouter);

router.use('/customer', customerRouter);

router.use('/loan-application', loanAppRouter);

router.use('/otp', otpRouter);

router.use('/users', userRouter);

router.use('/productTypes',productTypeRouter);

router.use('/shops', partnerRouter);

router.use('/products', productRouter);

router.use('/images', imageGalleryRotuer);

router.use('/customer-locations', custLocationRotuer);

router.use('/proposal', proposalRouter)

router.use('/pdf', pdfRouter)



export default router;
