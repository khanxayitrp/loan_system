"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTokenBlacklisted = exports.blacklistToken = void 0;
const blacklistedTokens = new Set();
const blacklistToken = (token) => {
    blacklistedTokens.add(token);
};
exports.blacklistToken = blacklistToken;
const isTokenBlacklisted = (token) => {
    return blacklistedTokens.has(token);
};
exports.isTokenBlacklisted = isTokenBlacklisted;
