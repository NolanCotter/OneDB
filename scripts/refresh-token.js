#!/usr/bin/env node
/**
 * Token Refresh Script
 * 
 * Uses a refresh token to get a new access token.
 * Run this periodically (e.g., every 50 minutes) to keep your API working.
 * 
 * Usage:
 *   node scripts/refresh-token.js
 * 
 * Or with cron (every 50 minutes):
 *   */50 * * * * cd /path/to/onedb && node scripts/refresh-token.js
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const REFRESH_TOKEN = process.env.ONEDRIVE_REFRESH_TOKEN;
const CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
const ENV_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');

if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required environment variables:');
  console.error('  - ONEDRIVE_REFRESH_TOKEN');
  console.error('  - ONEDRIVE_CLIENT_ID');
  console.error('  - ONEDRIVE_CLIENT_SECRET');
  console.error('\nRun the OAuth flow once to get these values.');
  console.error('See SETUP.md for instructions.');
  process.exit(1);
}

async function refreshAccessToken() {
  try {
    console.log('Refreshing access token...');
    
    const response = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Update .env file with new tokens
    let envContent = readFileSync(ENV_PATH, 'utf-8');
    
    // Update access token
    envContent = envContent.replace(
      /^ONEDRIVE_ACCESS_TOKEN=.*/m,
      `ONEDRIVE_ACCESS_TOKEN=${access_token}`
    );
    
    // Update refresh token if it changed (Microsoft sometimes rotates them)
    if (refresh_token && refresh_token !== REFRESH_TOKEN) {
      console.log('Refresh token was rotated, updating...');
      envContent = envContent.replace(
        /^ONEDRIVE_REFRESH_TOKEN=.*/m,
        `ONEDRIVE_REFRESH_TOKEN=${refresh_token}`
      );
      // Also update the in-memory value for next run
      process.env.ONEDRIVE_REFRESH_TOKEN = refresh_token;
    }

    writeFileSync(ENV_PATH, envContent);

    console.log(`✓ Access token refreshed successfully`);
    console.log(`  Expires in: ${expires_in} seconds (${Math.floor(expires_in / 60)} minutes)`);
    
    return { access_token, refresh_token, expires_in };
  } catch (error: any) {
    console.error('✗ Token refresh failed:', error.response?.data?.error_description || error.message);
    process.exit(1);
  }
}

refreshAccessToken();
