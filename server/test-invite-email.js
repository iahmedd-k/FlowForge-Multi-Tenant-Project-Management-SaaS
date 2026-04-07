const jwt = require('jsonwebtoken');
const { sendInviteEmail } = require('./services/email.service');
require('dotenv').config();

async function testInviteEmail() {
  console.log('🧪 Testing Invite Email Flow...\n');

  // Check configuration
  console.log('📋 Configuration:');
  console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`  SMTP Port: ${process.env.SMTP_PORT}`);
  console.log(`  SMTP User: ${process.env.SMTP_USER}`);
  console.log(`  Client URL: ${process.env.CLIENT_URL}`);
  console.log('');

  try {
    // Create a test invite token
    const testToken = jwt.sign(
      {
        workspaceId: 'test-workspace-123',
        email: 'testuser@example.com',
        role: 'member',
        type: 'workspace-invite',
      },
      process.env.INVITE_TOKEN_SECRET || 'invite-secret',
      { expiresIn: '48h' }
    );

    console.log('🔑 Created test invite token');
    console.log(`   Token length: ${testToken.length} chars`);
    console.log('');

    console.log('📧 Sending test invite email...\n');

    const result = await sendInviteEmail({
      to: process.env.SMTP_USER, // Send to same email as test
      inviterName: 'Ahmed Khan',
      workspaceName: 'Test Workspace',
      token: testToken,
      boardName: 'Test Dashboard',
    });

    console.log('✅ Invite email sent successfully!\n');
    console.log('Email Details:');
    console.log(`  Message ID: ${result?.messageId || 'N/A'}`);
    console.log(`  To: ${process.env.SMTP_USER}`);
    console.log('');
    console.log('✅ INVITE EMAIL FLOW IS WORKING!');

  } catch (err) {
    console.error('❌ Invite Email Test Failed!\n');
    console.error('Error Details:');
    console.error(`  Type: ${err.constructor.name}`);
    console.error(`  Message: ${err.message}`);
    console.error(`  Code: ${err.code}`);
    console.error(`  Response Code: ${err.responseCode}`);
    console.error('');
    console.error('Stack:');
    console.error(err.stack);
    process.exit(1);
  }
}

testInviteEmail();
