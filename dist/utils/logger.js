"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/// <reference path="../types/log4js-json-layout.d.ts" />
const log4js = __importStar(require("log4js"));
const log4js_json_layout_1 = __importDefault(require("log4js-json-layout"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const getLogFileName = () => {
    const now = new Date();
    return `./logs/accting-log-${now.toISOString().slice(0, 10)}.log`;
};
const logDirectory = './logs';
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory);
}
log4js.addLayout('json', (config) => (logEvent) => {
    const event = JSON.parse((0, log4js_json_layout_1.default)(config)(logEvent));
    const offset = 7 * 60 * 60 * 1000;
    const localTime = new Date(new Date(event.startTime).getTime() + offset).toISOString();
    event.startTime = localTime;
    return JSON.stringify(event);
});
log4js.configure({
    appenders: {
        app: {
            type: 'file',
            filename: getLogFileName(),
            layout: {
                type: 'pattern',
                pattern: '[%d] [%p] %c - %m',
            },
            maxLogSize: 1 * 1024 * 1024,
            backups: 10,
        },
        console: {
            type: 'console',
        },
    },
    categories: {
        default: { appenders: ['app', 'console'], level: 'debug' },
    },
});
exports.logger = log4js.getLogger();
const daysToKeep = 90;
const cleanOldLogs = () => {
    const files = fs_1.default.readdirSync(logDirectory);
    const now = Date.now();
    files.forEach(file => {
        if (file.startsWith('accting-log-') && file.endsWith('.log')) {
            const datePart = file.slice(12, 22);
            const fileDate = new Date(datePart);
            if (!isNaN(fileDate.getTime())) {
                const ageInDays = (now - fileDate.getTime()) / (1000 * 60 * 60 * 24);
                if (ageInDays > daysToKeep) {
                    const filePath = path_1.default.join(logDirectory, file);
                    fs_1.default.unlinkSync(filePath);
                    exports.logger.info(`Deleted log file 90 days old: ${file}`);
                }
            }
        }
    });
};
// make shecduled task to clean old logs
cleanOldLogs();
