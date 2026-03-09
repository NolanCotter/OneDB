"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const callback_1 = __importDefault(require("./auth/callback"));
const _key_1 = __importDefault(require("./data/[key]"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/auth/callback', callback_1.default);
app.use('/api/data/:key', _key_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
