require('dotenv').config();
const { Resend } = require('resend');

console.log('Testing Resend Email Service...\n');

// Check if API key exists
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✓ RESEND_API_KEY found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
console.log('✓ FROM_EMAIL:', process.env.FROM_EMAIL);
console.log('✓ FROM_NAME:', process.env.FROM_NAME);
console.log('\nSending test email...\n');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const result = await resend.emails.send({
      //from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      from: 'onboarding@resend.dev',
      to: 'jessgeojose@gmail.com', // Your email
      subject: 'Test Email from AEO Suite',
      html: `
        <h1>Test Email</h1>
        <p>If you receive this, Resend is working correctly!</p>
        <p>Your OTP code would be: <strong>123456</strong></p>
      `
    });

    console.log('✅ SUCCESS! Email sent');
    console.log('Email ID:', result.id);
    console.log('\nCheck your inbox (jessgeojose@gmail.com)');
    console.log('Also check spam folder!');
    
  } catch (error) {
    console.log('❌ FAILED! Email not sent');
    console.log('Error:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Fix: Check your RESEND_API_KEY in .env');
      console.log('   Get it from: https://resend.com/api-keys');
    }
    
    if (error.message.includes('not verified')) {
      console.log('\n💡 Fix: Use onboarding@resend.dev as FROM_EMAIL');
      console.log('   Or verify your domain in Resend');
    }
  }
  
  process.exit(0);
}

testEmail();
