
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// In-memory storage (replace with persistent storage for production)
let googleRefreshToken = null;
let oneDriveRefreshToken = null;

// Config - set these as env vars in Render
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const ONEDRIVE_CLIENT_ID = process.env.ONEDRIVE_CLIENT_ID;
const ONEDRIVE_CLIENT_SECRET = process.env.ONEDRIVE_CLIENT_SECRET;
const ONEDRIVE_REDIRECT_URI = process.env.ONEDRIVE_REDIRECT_URI;

// Google OAuth endpoints
app.get('/google/auth', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline&prompt=consent`;
    res.redirect(url);
});

app.get('/google/callback', async (req, res) => {
    const code = req.query.code;
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        }
    });
    googleRefreshToken = tokenRes.data.refresh_token;
    res.send('Google tokens obtained. Refresh token stored.');
});

app.get('/google/refresh', async (req, res) => {
    if (!googleRefreshToken) return res.status(400).send('Google refresh token missing.');
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: googleRefreshToken,
            grant_type: 'refresh_token'
        }
    });
    res.json(tokenRes.data);
});

// OneDrive OAuth endpoints
app.get('/onedrive/auth', (req, res) => {
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${ONEDRIVE_CLIENT_ID}&scope=offline_access%20Files.ReadWrite&response_type=code&redirect_uri=${encodeURIComponent(ONEDRIVE_REDIRECT_URI)}`;
    res.redirect(url);
});

app.get('/onedrive/callback', async (req, res) => {
    const code = req.query.code;
    const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', null, {
        params: {
            client_id: ONEDRIVE_CLIENT_ID,
            client_secret: ONEDRIVE_CLIENT_SECRET,
            code,
            redirect_uri: ONEDRIVE_REDIRECT_URI,
            grant_type: 'authorization_code'
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    oneDriveRefreshToken = tokenRes.data.refresh_token;
    res.send('OneDrive tokens obtained. Refresh token stored.');
});

app.get('/onedrive/refresh', async (req, res) => {
    if (!oneDriveRefreshToken) return res.status(400).send('OneDrive refresh token missing.');
    const tokenRes = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', null, {
        params: {
            client_id: ONEDRIVE_CLIENT_ID,
            client_secret: ONEDRIVE_CLIENT_SECRET,
            refresh_token: oneDriveRefreshToken,
            grant_type: 'refresh_token'
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    res.json(tokenRes.data);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
