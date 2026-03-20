require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('\n📧 ===== GMAIL CONNECTION TEST =====\n');
console.log('Configuration:');
console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('  EMAIL_USER:', process.env.EMAIL_USER);
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***HIDDEN***' : 'NOT SET');
console.log('');

async function testGmail() {
  try {
    console.log('🔄 Creating transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Transporter created successfully\n');

    console.log('🧪 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Blackline Matrix - Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0;">
          <div style="background: white; padding: 20px; border-radius: 10px;">
            <h2>✅ Email Service is Working!</h2>
            <p>If you received this email, the Gmail SMTP configuration is correct.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      `
    });
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('\n🎉 YOUR EMAIL SERVICE IS WORKING!\n');
    console.log('📧 Message sent to:', process.env.EMAIL_USER);
    console.log('Check your Gmail inbox for the test email.\n');
    
  } catch (error) {
    console.error('\n❌ ===== ERROR =====');
    console.error('Error Type:', error.code || error.name);
    console.error('Error Message:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  AUTHENTICATION ERROR');
      console.error('Possible causes:');
      console.error('  1. App password is incorrect');
      console.error('  2. App password has expired');
      console.error('  3. Two-factor authentication not enabled');
      console.error('  4. Less secure apps need to be enabled');
      console.error('\n📖 Solution:');
      console.error('  1. Go to https://myaccount.google.com/apppasswords');
      console.error('  2. Select "Mail" and "Windows Computer"');
      console.error('  3. Generate a new app password');
      console.error('  4. Copy the 16-character password (without spaces)');
      console.error('  5. Update EMAIL_PASS in .env');
    } else if (error.code === 'ESOCKET') {
      console.error('\n⚠️  SOCKET/NETWORK ERROR');
      console.error('Possible causes:');
      console.error('  1. Network connection issue');
      console.error('  2. Firewall blocking Gmail SMTP');
      console.error('  3. Gmail server is down');
    } else {
      console.error('\n⚠️  NODEMAILER ERROR');
      console.error('Details:', error);
    }
    console.error('\n==================\n');
    process.exit(1);
  }
}

// Run test
testGmail().then(() => {
  console.log('✨ Test completed successfully. Exiting.\n');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
