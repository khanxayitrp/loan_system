"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loan_contract_controller_1 = __importDefault(require("../controllers/loan_contract.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
/***************** LOAN CONTRACT ROUTES *****************/
router.post('/:loanId/created', auth_middleware_1.verifyToken, loan_contract_controller_1.default.createLoanContract);
router.get('/:loanId', auth_middleware_1.verifyToken, loan_contract_controller_1.default.getLoanContract);
exports.default = router;
