const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { sendInviteEmail } = require('./services/email.service');
require('dotenv').config();

async function testUserInvite() {
  console.log('🧪 Testing User Invite Flow (Simulated)\n');

  // Check all required configs
  console.log('📋 Configuration Check:');
  const configs = {
    INVITE_TOKEN_SECRET: process.env.INVITE_TOKEN_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS ? '***set***' : '❌ MISSING',
    MONGO_URI: process.env.MONGO_URI ? '***set***' : '❌ MISSING',
  };

  Object.entries(configs).forEach(([key, value]) => {
    const status = value === '❌ MISSING' ? '❌' : '✅';
    const displayValue = value === '***set***' ? '✅ Set' : value;
    console.log(`  ${status} ${key}: ${displayValue}`);
  });

  if (!process.env.INVITE_TOKEN_SECRET) {
    console.log('\n❌ Missing INVITE_TOKEN_SECRET');
    process.exit(1);
  }

  if (!process.env.SMTP_PASS) {
    console.log('\n❌ Missing SMTP_PASS');
    process.exit(1);
  }

  console.log('');

  try {
    // Step 1: Create a token (like JWT.sign in the endpoint)
    console.log('Step 1️⃣  Creating invite token...');
    const testEmail = 'invited-user@test.com';
    const testWorkspaceId = new mongoose.Types.ObjectId();
    const testRole = 'member';

    const token = jwt.sign(
      {
        email: testEmail,
        workspaceId: testWorkspaceId.toString(),
        role: testRole,
      },
      process.env.INVITE_TOKEN_SECRET,
      { expiresIn: '48h' }
    );

    console.log(`  ✅ Token created (${token.length} chars)`);
    console.log('');

    // Step 2: Send the email (this is where you said it fails)
    console.log('Step 2️⃣  Sending invite email...');
    
    const result = await sendInviteEmail({
      to: testEmail,
      inviterName: 'Ahmed Khan',
      workspaceName: 'Test Workspace',
      token,
      boardName: 'Test Workspace dashboard',
    });

    console.log('  ✅ Email sent successfully!');
    console.log(`     Message ID: ${result?.messageId || 'N/A'}`);
    console.log(`     To: ${testEmail}`);
    console.log('');

    console.log('✅ USER INVITE FLOW IS WORKING!\n');
    console.log('Summary:');
    console.log('  ✓ Token generation works');
    console.log('  ✓ Email sending works');
    console.log('  ✓ Configuration is correct');
    console.log('');
    console.log('🔍 NEXT STEPS:');
    console.log('  1. Check server logs when you actually send an invite from the UI');
    console.log('  2. Look for [invite-endpoint-error] logs');
    console.log('  3. Share the actual error message from the logs');

  } catch (err) {
    console.log('❌ Test Failed!\n');
    console.log('Error Details:');
    console.error('  Name:', err.constructor.name);
    console.error('  Message:', err.message);
    console.error('  Code:', err.code);
    console.error('  Response Code:', err.responseCode);
    console.error('');
    
    if (err.message.includes('responseCode')) {
      console.log('⚠️  This appears to be a real SMTP error');
    }
    
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testUserInvite();
