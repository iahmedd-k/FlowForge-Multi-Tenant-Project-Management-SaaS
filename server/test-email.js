const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('🔍 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 SMTP Config:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Pass: ${process.env.SMTP_PASS ? '***hidden***' : 'NOT SET'}`);
  console.log('');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Missing SMTP credentials in .env file');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('🧪 Testing SMTP Connection...\n');

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP Connection Verified!\n');

    // Send test email
    console.log('📧 Sending test email...\n');
    const testEmail = process.env.SMTP_USER; // Send to the same email

    const info = await transporter.sendMail({
      from: `"FlowForge Test" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '✅ FlowForge Email Test - Everything is Working!',
      text: 'This is a test email from FlowForge. If you received this, email is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2>✅ Email is Working!</h2>
          <p>This test email was sent from FlowForge at <strong>${new Date().toLocaleString()}</strong></p>
          <p style="color: green; font-weight: bold;">Email configuration is correct and functional.</p>
          <hr style="border: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            SMTP Server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}<br>
            From: ${process.env.SMTP_USER}
          </p>
        </div>
      `,
    });

    console.log('📬 Email sent successfully!\n');
    console.log('Email Details:');
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`  To: ${testEmail}`);
    console.log(`  Response: ${info.response}`);
    console.log('\n✅ EMAIL IS WORKING CORRECTLY!\n');

  } catch (err) {
    console.log('❌ Email Test Failed!\n');
    console.log('Error Details:');
    console.log(`  Code: ${err.code}`);
    console.log(`  Message: ${err.message}`);
    console.log(`  Command: ${err.command}`);
    console.log('\n⚠️  Common Issues:');
    console.log('  1. Gmail requires "App Passwords" (not regular password)');
    console.log('  2. App Password format: 16 characters, all lowercase');
    console.log('  3. Check 2FA is enabled on Gmail account');
    console.log('  4. Verify SMTP_PORT is 465 (or 587 for TLS)');
    console.log('  5. Check firewall/network blocking SMTP port');
    console.log('\nFix your .env file and try again.');
    process.exit(1);
  }
}

testEmail();
