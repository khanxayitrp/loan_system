"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGallery = exports.saveImageToGallery = void 0;
const product_gallery_service_1 = __importDefault(require("../services/product_gallery.service"));
const saveImageToGallery = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const { uploadResult } = req.body; // Result ຈາກ API ອັບໂຫລດທີ່ທ່ານສົ່ງມາໃຫ້ເບິ່ງ
        console.log('this data is', uploadResult);
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
        await product_gallery_service_1.default.addImageGallery(Number(productId), uploadResult.data.uploaded);
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
    }
    catch (error) {
        console.error('❌ [Controller] Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update gallery'
        });
    }
};
exports.saveImageToGallery = saveImageToGallery;
const getGallery = async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Product ID'
            });
        }
        const images = await product_gallery_service_1.default.getAllImage(productId);
        return res.status(200).json({
            success: true,
            data: images
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
};
exports.getGallery = getGallery;
