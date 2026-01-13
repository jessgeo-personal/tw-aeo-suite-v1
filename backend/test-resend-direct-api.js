require('dotenv').config();

console.log('Testing Resend API Directly (no SDK)\n');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('❌ RESEND_API_KEY not found');
  process.exit(1);
}

console.log('✓ API Key:', apiKey.substring(0, 15) + '...');

async function testDirectAPI() {
  try {
    console.log('\n📡 Calling Resend API directly...\n');
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@thatworkx.com',
        to: 'jessgeojose@gmail.com',
        subject: 'Direct API Test - AEO Suite',
        html: '<h1>Direct API Test</h1><p>This email was sent directly to Resend API without the SDK.</p>'
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    
    const data = await response.json();
    
    console.log('\n📬 RESPONSE DATA:');
    console.log(JSON.stringify(data, null, 2));
    
    if (response.ok && data.id) {
      console.log('\n✅ SUCCESS!');
      console.log('Email ID:', data.id);
      console.log('\nCheck your email: jessgeojose@gmail.com');
      console.log('View in dashboard: https://resend.com/emails/' + data.id);
    } else {
      console.log('\n❌ FAILED!');
      if (data.message) {
        console.log('Error:', data.message);
      }
      
      if (response.status === 401) {
        console.log('\n💡 FIX: Invalid API key');
        console.log('   Generate new key at: https://resend.com/api-keys');
      }
      
      if (response.status === 403) {
        console.log('\n💡 FIX: Account issue');
        console.log('   Check your Resend account status');
      }
      
      if (response.status === 429) {
        console.log('\n💡 FIX: Rate limit');
        console.log('   Wait a few minutes');
      }
    }
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

testDirectAPI();
