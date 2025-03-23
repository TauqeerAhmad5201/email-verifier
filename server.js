const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.EMAIL_API_KEY;

// Security middleware
app.use(helmet());
// Compression middleware
app.use(compression());
// Serve static files
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.json());

// Add this route handler for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rate limiting (simple version)
const requestCounts = {};
app.use((req, res, next) => {
  const ip = req.ip;
  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, timestamp: Date.now() };
  } else {
    const timePassed = Date.now() - requestCounts[ip].timestamp;
    if (timePassed < 60000 && requestCounts[ip].count > 20) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    if (timePassed > 60000) {
      requestCounts[ip] = { count: 1, timestamp: Date.now() };
    } else {
      requestCounts[ip].count++;
    }
  }
  next();
});

app.post('/verify-email', async (req, res) => {
    console.log('Received verification request:', req.body);
    const { email } = req.body;
    
    if (!email) {
        console.log('Email missing in request');
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        console.log(`Making API request for email: ${email}`);
        const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${API_KEY}`);
        
        if (!response.ok) {
            console.log(`API error status: ${response.status}`);
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response data:', data);

        // Enhanced email verification status handling
        if (data.data) {
            // Prefer status over deprecated result field
            const status = data.data.status || data.data.result;
            const score = data.data.score || 0;
            
            let message, valid;
            
            switch(status) {
                case 'deliverable':
                    message = 'Email is valid and deliverable';
                    valid = true;
                    break;
                case 'accept_all':
                    message = `Email domain accepts all emails (risky) - Confidence score: ${score}%`;
                    valid = 'risky';
                    break;
                case 'risky':
                    message = `Email might be valid but is risky - Confidence score: ${score}%`;
                    valid = 'risky';
                    break;
                case 'undeliverable':
                    message = 'Email is invalid (undeliverable)';
                    valid = false;
                    break;
                case 'unknown':
                    message = `Email verification inconclusive - Confidence score: ${score}%`;
                    valid = 'unknown';
                    break;
                default:
                    message = `Email verification result: ${status} - Confidence score: ${score}%`;
                    valid = 'unknown';
            }
            
            // Add additional details if available
            const details = [];
            if (data.data.disposable) details.push('Disposable email detected');
            if (data.data.gibberish) details.push('Possibly gibberish email');
            if (!data.data.mx_records) details.push('No MX records found');
            if (!data.data.smtp_server) details.push('SMTP server issues detected');
            
            if (details.length > 0) {
                message += ' (' + details.join(', ') + ')';
            }
            
            res.json({ 
                message, 
                valid, 
                score: score,
                details: {
                    status,
                    disposable: data.data.disposable,
                    webmail: data.data.webmail,
                    mxRecords: data.data.mx_records,
                    smtpCheck: data.data.smtp_check
                }
            });
        } else {
            console.log('Invalid API response format');
            res.status(500).json({ message: 'Invalid API response format', valid: false });
        }
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({ message: 'Error verifying email' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
