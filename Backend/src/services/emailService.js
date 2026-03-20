const nodemailer = require('nodemailer');

console.log('\n📦 ===== EMAIL SERVICE INITIALIZATION =====');
console.log('Nodemailer version:', require('nodemailer/package.json').version);
console.log('EMAIL_SERVICE env var:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER configured:', !!process.env.EMAIL_USER);
console.log('EMAIL_PASS configured:', !!process.env.EMAIL_PASS);
console.log('==========================================\n');

let cachedTransporter = null;
let transporterVerified = false;

// Email configuration
const createTransporter = async () => {
  // Return cached transporter if already verified
  if (cachedTransporter && transporterVerified) {
    console.log('♻️  Using verified cached email transporter');
    return cachedTransporter;
  }

  // For development: Use Gmail SMTP or Ethereal (fake email service)
  // For production: Use SendGrid, AWS SES, or other professional service
  
  if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    throw new Error(`Nodemailer not properly loaded. Type: ${typeof nodemailer}, createTransport: ${typeof nodemailer?.createTransport}`);
  }
  
  console.log('🔄 Creating new email transporter for service:', process.env.EMAIL_SERVICE);

  if (process.env.EMAIL_SERVICE === 'gmail') {
    // Gmail configuration (requires app password)
    console.log('📧 Configuring Gmail transporter');
    console.log('   User:', process.env.EMAIL_USER);
    console.log('   Pass configured:', !!process.env.EMAIL_PASS);
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Gmail app password
      },
      // Additional Gmail-specific settings for better deliverability
      secure: true,
      tls: {
        rejectUnauthorized: false
      },
      connectionUrl: `smtp://${process.env.EMAIL_USER}:${process.env.EMAIL_PASS}@smtp.gmail.com:465?secure=true`
    });
    
    console.log('🧪 Verifying Gmail connection...');
    try {
      await transporter.verify();
      console.log('✅ Gmail connection verified successfully!');
      transporterVerified = true;
    } catch (verifyErr) {
      console.error('❌ Gmail verification FAILED:', verifyErr.code, verifyErr.message);
      transporterVerified = false;
      throw verifyErr;
    }
    
    console.log('✅ Gmail transporter created and verified');
    cachedTransporter = transporter;
    return transporter;
  } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
    // SendGrid configuration
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'smtp') {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else if (process.env.EMAIL_SERVICE === 'ethereal') {
    // Ethereal configuration (for testing - creates fake email account)
    // Emails can be viewed at https://ethereal.email
    console.log('🧪 Using Ethereal email service for testing...');
    const account = await nodemailer.createTestAccount();
    console.log('📧 Ethereal account created:', account.user, account.pass);
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
  } else {
    // Development mode: Use console logging
    console.log('⚠️  No email service configured. Using console logging for development.');
    return null;
  }
};

// Email templates
const getEmailTemplate = (type, data) => {
  const baseStyle = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📊 Blackline Matrix</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Professional Trading Journal Platform</p>
      </div>
      <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  `;

  const baseFooter = `
      </div>
      <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
        <p>© 2025 Blackline Matrix. All rights reserved.</p>
        <p>If you didn't request this email, please ignore it.</p>
      </div>
    </div>
  `;

  switch (type) {
    case 'verification':
      return baseStyle + `
        <h2 style="color: #1e293b; margin-top: 0;">Welcome to Blackline Matrix! 🎉</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Thank you for registering with Blackline Matrix! To complete your registration and start tracking your trading journey, please verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationLink}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: 600;
                    font-size: 16px;">
            ✓ Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          Or copy and paste this link into your browser:<br>
          <a href="${data.verificationLink}" style="color: #667eea; word-break: break-all;">${data.verificationLink}</a>
        </p>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 30px;">
          This verification link will expire in <strong>24 hours</strong>.
        </p>
      ` + baseFooter;

    case 'verificationOTP':
      return baseStyle + `
        <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email 📧</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Thank you for registering with Blackline Matrix! Please use the OTP below to complete your registration.
        </p>
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px dashed #0284c7;">
          <div style="color: #64748b; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Your Verification OTP</div>
          <div style="font-size: 48px; font-weight: bold; color: #0c4a6e; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 10px 0;">
            ${data.otp}
          </div>
          <div style="color: #64748b; font-size: 14px; margin-top: 10px;">Enter this code to verify your email</div>
        </div>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
            ⚠️ <strong>Security Notice:</strong> This OTP will expire in <strong>10 minutes</strong>. Never share this code with anyone.
          </p>
        </div>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          If you didn't create an account with Blackline Matrix, please ignore this email.
        </p>
      ` + baseFooter;

    case 'passwordReset':
      return baseStyle + `
        <h2 style="color: #1e293b; margin-top: 0;">Your Temporary Password 🔐</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Here is your temporary password:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); 
                      border: 2px dashed #ec4899;
                      padding: 20px 40px; 
                      border-radius: 12px; 
                      display: inline-block;">
            <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Temporary Password</p>
            <p style="margin: 10px 0 0 0; 
                      color: #1e293b; 
                      font-size: 32px; 
                      font-weight: 700; 
                      font-family: 'Courier New', monospace;
                      letter-spacing: 3px;">
              ${data.tempPassword}
            </p>
          </div>
        </div>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          <strong>How to use:</strong>
        </p>
        <ol style="color: #475569; font-size: 15px; line-height: 1.8;">
          <li>Go to the login page</li>
          <li>Enter your email address</li>
          <li>Copy and paste the temporary password above</li>
          <li>After logging in, go to Settings to change your password</li>
        </ol>
        <p style="color: #ef4444; font-size: 14px; line-height: 1.6; background: #fef2f2; padding: 12px; border-radius: 6px; border-left: 3px solid #ef4444; margin-top: 30px;">
          ⚠️ <strong>Security Notice:</strong> If you didn't request this password reset, please contact support immediately. Someone may be trying to access your account.
        </p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 20px;">
          💡 <strong>Tip:</strong> We recommend changing this temporary password to something memorable as soon as possible.
        </p>
      ` + baseFooter;

    case 'welcome':
      return baseStyle + `
        <h2 style="color: #1e293b; margin-top: 0;">Welcome to Blackline Matrix! 🚀</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hi <strong>${data.name}</strong>,
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your email has been verified successfully! You're now ready to start your trading journey with Blackline Matrix.
        </p>
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
          <h3 style="color: #0c4a6e; margin: 0 0 10px 0;">🎯 Get Started:</h3>
          <ul style="color: #475569; margin: 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Log your first trade and start tracking your performance</li>
            <li style="margin: 8px 0;">Explore educational resources in the Resources section</li>
            <li style="margin: 8px 0;">Join the community forum and connect with other traders</li>
            <li style="margin: 8px 0;">View your analytics dashboard for performance insights</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardLink}" 
             style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                    color: white; 
                    padding: 14px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block;
                    font-weight: 600;
                    font-size: 16px;">
            📊 Go to Dashboard
          </a>
        </div>
      ` + baseFooter;

    default:
      return baseStyle + `
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          ${data.message}
        </p>
      ` + baseFooter;
  }
};

// Send email function
const sendEmail = async (to, subject, type, data) => {
  try {
    console.log('\n🔄 ===== SENDING EMAIL =====');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Type:', type);
    console.log('Email Service:', process.env.EMAIL_SERVICE || 'none');
    
    const transporter = await createTransporter();

    if (!transporter) {
      // Development mode: Log to console with prominent OTP display
      console.log('\n⚠️  ===== EMAIL SERVICE UNAVAILABLE =====');
      console.log('📌 Using Console Logging Mode (Development)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Type:', type);
      
      // Highlight OTP for verification type
      if (type === 'verificationOTP' && data.otp) {
        console.log('\n🔑 ==================== OTP CODE ====================');
        console.log(`   OTP: ${data.otp}`);
        console.log('🔑 ====================================================');
      }
      
      console.log('\nEmail Data:', JSON.stringify(data, null, 2));
      console.log('=========================================\n');
      return { success: true, messageId: 'dev-mode', info: 'Logged to console' };
    }

    const htmlContent = getEmailTemplate(type, data);

    const mailOptions = {
      from: `"Blackline Matrix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      // Add headers to improve deliverability and avoid spam filters
      headers: {
        'X-Mailer': 'Blackline Matrix Email Service',
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      // Add reply-to to allow replies
      replyTo: process.env.EMAIL_USER
    };

    console.log('📤 Sending via', process.env.EMAIL_SERVICE, 'to', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('=============================\n');
    
    // For Ethereal, log the preview URL
    if (process.env.EMAIL_SERVICE === 'ethereal') {
      console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return { success: true, messageId: info.messageId, info };

  } catch (error) {
    console.error('\n❌ ===== EMAIL SEND FAILED =====');
    console.error('Error Type:', error.code || error.name);
    console.error('Error Message:', error.message);
    console.error('Service:', process.env.EMAIL_SERVICE);
    
    // Additional debugging for Gmail errors
    if (process.env.EMAIL_SERVICE === 'gmail') {
      console.error('\n📧 Gmail Debugging Info:');
      console.error('- User:', process.env.EMAIL_USER);
      console.error('- App Password configured:', !!process.env.EMAIL_PASS);
      console.error('- Error details:', error.response?.body || error.toString());
    }
    
    console.error('================================\n');
    return { success: false, error: error.message };
  }
};

const sendVerificationEmail = async (user, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
  
  return sendEmail(
    user.email,
    'Verify Your Email - Blackline Matrix',
    'verification',
    {
      name: user.name,
      verificationLink
    }
  );
};

const sendVerificationOTPEmail = async (user, otp) => {
  console.log('\n📧 ============ SENDING OTP EMAIL ============');
  console.log('To:', user.email);
  console.log('User:', user.name);
  console.log('OTP Code:', otp, '(Type:', typeof otp + ')');
  console.log('Service:', process.env.EMAIL_SERVICE);
  console.log('=========================================\n');
  
  const result = await sendEmail(
    user.email,
    'Your Verification Code - Blackline Matrix',
    'verificationOTP',
    {
      name: user.name,
      otp
    }
  );
  
  // If email failed and Gmail is configured, show the OTP in console for testing
  if (!result.success && process.env.EMAIL_SERVICE === 'gmail') {
    console.error('\n⚠️  ========== GMAIL EMAIL FAILED ==========');
    console.error('📩 Email could not be sent via Gmail.');
    console.error('🔑 OTP for testing:', otp);
    console.error('📧 Recipient:', user.email);
    console.error('⏰ OTP will expire in 10 minutes');
    console.error('✨ For development: You can directly use the OTP above');
    console.error('==========================================\n');
  }
  
  return result;
};

const sendPasswordResetEmail = async (user, tempPassword) => {
  return sendEmail(
    user.email,
    'Your Temporary Password - Blackline Matrix',
    'passwordReset',
    {
      name: user.name,
      tempPassword: tempPassword
    }
  );
};

const sendWelcomeEmail = async (user) => {
  const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
  
  return sendEmail(
    user.email,
    'Welcome to Blackline Matrix! 🎉',
    'welcome',
    {
      name: user.name,
      dashboardLink
    }
  );
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendVerificationOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
