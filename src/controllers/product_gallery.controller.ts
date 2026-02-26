import { Request, Response } from 'express';
import ProductGalleryService from '../services/product_gallery.service';

export const saveImageToGallery = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId);
        const {uploadResult} = req.body; // Result ຈາກ API ອັບໂຫລດທີ່ທ່ານສົ່ງມາໃຫ້ເບິ່ງ
        console.log('this data is', uploadResult)
        // 1. Validation ຂໍ້ມູນເບື້ອງຕົ້ນ
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Product ID'
                });
            }
        if (!uploadResult.success || !Array.isArray(uploadResult.data.uploaded) || uploadResult.data.uploaded.length === 0) {
            return res.status(400).json({ message: 'No images to save' });
        }

        // ບັນທຶກລົງ DB
        await ProductGalleryService.addImageGallery(
            Number(productId),
            uploadResult.data.uploaded
        );

        console.log('✅ Gallery saved successfully');

        // 6. Response
        res.status(201).json({
            success: true,
            message: `Saved ${uploadResult.data.uploaded.length} images to gallery`,
            data: {
                saved_count: uploadResult.data.uploaded.length,
                failed_count: uploadResult.data.failed?.length || 0
            }
        });

    } catch (error: any) {
        console.error('❌ [Controller] Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update gallery'
        });
    }
}

export const getGallery = async (req: Request, res: Response) => {
    try {
        const productId = parseInt(req.params.productId);

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Product ID'
            });
        }
        const images = await ProductGalleryService.getAllImage(productId);

        return res.status(200).json({
            success: true,
            data: images
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}