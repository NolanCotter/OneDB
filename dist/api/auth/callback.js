"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
const REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI;
router.get('/', async (req, res) => {
    const code = req.query.code;
    if (!code)
        return res.status(400).send('Missing code');
    try {
        const tokenRes = await axios_1.default.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        // Return the refresh token for storage
        res.json({
            access_token: tokenRes.data.access_token,
            refresh_token: tokenRes.data.refresh_token,
            expires_in: tokenRes.data.expires_in,
        });
    }
    catch (e) {
        res.status(500).json({ error: e.response?.data?.error?.message || e.message });
    }
});
exports.default = router;
