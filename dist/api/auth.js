"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI;
router.post('/', (_req, res) => {
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_mode=query&scope=Files.ReadWrite offline_access`;
    res.json({ url: authUrl });
});
exports.default = router;
