require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...\n');
console.log('Connection String:', process.env.MONGODB_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('\n✅ SUCCESS! MongoDB Connected');
    console.log('Host:', mongoose.connection.host);
    console.log('Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((err) => {
    console.log('\n❌ FAILED! MongoDB Connection Error');
    console.log('Error:', err.message);
    console.log('\nCommon causes:');
    console.log('1. Wrong password');
    console.log('2. Special characters in password need URL encoding');
    console.log('3. Wrong username');
    console.log('4. User not created in MongoDB Atlas');
    process.exit(1);
  });