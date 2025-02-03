const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require('dotenv').config();

const app = express();
const upload = multer({ dest: "uploads/" });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Serve index.html at root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // your password or app-specific password
  },
});

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Process emails from CSV
async function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const emails = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        // Assuming first column contains emails
        const email = Object.values(row)[0];
        if (isValidEmail(email)) {
          emails.push(email);
        }
      })
      .on("end", () => {
        // Clean up: delete the uploaded file
        fs.unlinkSync(filePath);
        resolve(emails);
      })
      .on("error", reject);
  });
}

// Test route to verify server is working
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working properly' });
});

// Send email endpoint
app.post("/send-email", upload.single("csvFile"), async (req, res) => {
  try {
    let recipientEmails = [];

    // Process CSV if uploaded
    if (req.file) {
      recipientEmails = await processCSV(req.file.path);
    } else if (req.body.emails) {
      // Process comma-separated emails
      recipientEmails = req.body.emails
        .split(",")
        .map((email) => email.trim())
        .filter(isValidEmail);
    }

    if (recipientEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid email addresses provided",
      });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      bcc: recipientEmails, // Use BCC for privacy
      subject: req.body.subject,
      html: req.body.content,
      // Add plain text version
      text: req.body.content.replace(/<[^>]*>/g, ""),
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Emails sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({
      success: false,
      message: "Error sending emails",
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
