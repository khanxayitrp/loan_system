"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerProposal = exports.createProposal = void 0;
const Proposal_service_1 = __importDefault(require("../services/Proposal.service"));
/**
 * ✅ สร้าง Proposal ใหม่
 * POST /api/proposal/:customerId/new
 */
const createProposal = async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'customer_id ບໍ່ຖືກຕ້ອງ'
            });
        }
        const { loan_id, data } = req.body;
        if (!data) {
            return res.status(400).json({
                success: false,
                message: 'data is required'
            });
        }
        const userId = req.userPayload?.userId;
        console.log('data all ', data);
        const ProposalData = {
            ...data,
            customer_id: customerId,
            loan_id,
            performed_by: Number(userId)
        };
        console.log('ProposalData all ', ProposalData);
        const result = await Proposal_service_1.default.CreateProposal(ProposalData);
        res.status(201).json({
            success: true,
            message: 'ສ້າງ proposal ສຳເລັດແລ້ວ',
            data: result
        });
    }
    catch (error) {
        console.error('Create Location Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.createProposal = createProposal;
/**
 * ✅ ดึงรายการ Proposal ของลูกค้า
 * GET /api/proposal/:customerId/get/:loan_id
 */
const getCustomerProposal = async (req, res) => {
    try {
        const customerId = parseInt(req.params.customerId);
        const loan_id = parseInt(req.params.loan_id);
        if (!customerId || isNaN(customerId)) {
            return res.status(400).json({
                success: false,
                message: 'customer_id ບໍ່ຖືກຕ້ອງ'
            });
        }
        const result = await Proposal_service_1.default.getProposal(loan_id, customerId);
        res.status(200).json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Get Locations Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getCustomerProposal = getCustomerProposal;
