"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
class PortService {
    findAvailablePort(Port, callback) {
        const server = net_1.default.createServer();
        server.once('error', (err) => {
            if (err.message.includes('EADDRINUSE')) {
                // Port is in use, try the next one
                this.findAvailablePort(Port + 1, callback);
            }
            else {
                callback(err);
            }
        });
        server.once('listening', () => {
            server.close(() => callback(null, Port));
        });
        server.listen(Port);
    }
}
exports.default = PortService;
// export default new PortService();
