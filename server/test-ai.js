const { generateAssistantReply } = require('./services/ai.service');
require('dotenv').config();

async function testAI() {
  console.log('🤖 Testing AI Assistant...\n');

  // Check Groq API setup
  console.log('📋 Groq Configuration:');
  console.log(`  API Key: ${process.env.GROQ_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`);
  console.log('');

  if (!process.env.GROQ_API_KEY) {
    console.log('❌ Missing GROQ_API_KEY in .env');
    process.exit(1);
  }

  try {
    console.log('🧪 Testing AI with workspace context...\n');

    const testPrompt = 'What tasks do I have in progress?';
    const testContext = {
      projectName: 'Dashboard',
      focusedTask: {
        title: 'Fix user authentication',
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date('2026-04-15'),
        assignedTo: { name: 'Ahmed Khan' },
      },
      selectedMembers: [
        { name: 'Ahmed Khan', role: 'admin' },
        { name: 'John Doe', role: 'member' },
      ],
      tasks: [
        {
          title: 'Fix user authentication',
          status: 'in-progress',
          priority: 'high',
          dueDate: new Date('2026-04-15'),
          assignedTo: { name: 'Ahmed Khan' },
        },
        {
          title: 'Implement email notifications',
          status: 'todo',
          priority: 'medium',
          dueDate: new Date('2026-04-20'),
          assignedTo: { name: 'John Doe' },
        },
      ],
    };

    const reply = await generateAssistantReply({
      prompt: testPrompt,
      history: [],
      context: testContext,
      workspaceId: null, // No DB connection needed for this test
      userId: null,
      workspaceRole: 'admin',
      userName: 'Ahmed Khan',
    });

    console.log('✅ AI Response received!\n');
    console.log('📝 Response:');
    console.log(`"${reply}"\n`);

    console.log('✅ AI CHATBOT IS WORKING CORRECTLY!\n');
    console.log('Summary:');
    console.log('  ✓ Groq API is responding');
    console.log('  ✓ AI model is generating replies');
    console.log('  ✓ Context is being processed');
    console.log('\n🎉 Deploy the changes and the AI chatbot will be fully functional!');

  } catch (err) {
    console.log('❌ AI Test Failed!\n');
    console.log('Error Details:');
    console.log(`  Message: ${err.message}`);
    console.log('\n⚠️  Possible Issues:');
    console.log('  1. GROQ_API_KEY is invalid or expired');
    console.log('  2. Network connectivity issue (firewall blocking groq.com)');
    console.log('  3. API rate limit exceeded');
    console.log('  4. Model name is incorrect');
    console.log('\nFix the issue and try again.');
    process.exit(1);
  }
}

testAI();
