const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail, sendVerificationOTPEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/emailService');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('\n📝 ===== REGISTRATION REQUEST =====');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Role:', role);
    
    if (!name || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('⚠️  Email already registered:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }

    const capitalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Trader';
    const user = new User({ name, email: email.toLowerCase(), role: capitalizedRole });
    await user.setPassword(password);
    
    // Generate OTP as string with exactly 4 digits
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    console.log('🔐 OTP Generated:', otp, '| Type:', typeof otp);
    console.log('⏰ Expires at:', new Date(user.emailVerificationOTPExpires).toISOString());
    
    await user.save();
    console.log('💾 User created in database');

    // Send OTP email with error handling
    console.log('📧 Attempting to send OTP email...');
    console.log('   To:', user.email);
    console.log('   OTP:', otp);
    const otpResult = await sendVerificationOTPEmail(user, otp);
    console.log('📨 Email service result:', otpResult);
    
    if (!otpResult.success) {
      console.error('\n❌ ===== REGISTRATION FAILED: EMAIL SEND ERROR =====');
      console.error('Error:', otpResult.error);
      console.error('Action: Deleting user from database');
      // Delete user if email failed
      await User.deleteOne({ _id: user._id });
      console.error('✅ User deleted');
      console.error('==================================================\n');
      
      return res.status(500).json({ 
        error: `Failed to send verification email: ${otpResult.error}. Please try again or contact support.`,
        debug: process.env.NODE_ENV === 'development' ? { otp, email } : undefined
      });
    }
    
    console.log('✅ OTP email sent successfully!');
    console.log('📨 Message ID:', otpResult.messageId);
    console.log('===== REGISTRATION SUCCESS =====\n');

    return res.status(201).json({ 
      success: true,
      message: 'Registration successful! Check your email for the verification code.',
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    console.error('\n💥 ===== REGISTRATION ERROR =====');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('==================================\n');
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('🔐 OTP verification requested for:', email, 'OTP:', otp);
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ error: 'User not found' });
    }

   
    if (user.isEmailVerified) {
      console.log('✅ Email already verified');
      return res.json({ 
        ok: true, 
        message: 'Email already verified! You can now log in.' 
      });
    }

    // Check if OTP expired
    if (!user.emailVerificationOTPExpires || user.emailVerificationOTPExpires < Date.now()) {
      console.log('❌ OTP expired');
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

  
    // Convert both to strings for comparison
    const storedOTP = String(user.emailVerificationOTP);
    const providedOTP = String(otp);
    console.log('🔍 OTP Comparison:', 'Stored:', storedOTP, '(type:', typeof storedOTP + ')', 'Provided:', providedOTP, '(type:', typeof providedOTP + ')');
    
    if (storedOTP !== providedOTP) {
      console.log('❌ Invalid OTP. Expected:', storedOTP, 'Got:', providedOTP);
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();
    
    console.log('✅ Email verified successfully');

    // Generate JWT token for auto-login
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    console.log('📧 Sending welcome email...');
    const welcomeResult = await sendWelcomeEmail(user);
    console.log('📧 Welcome email result:', welcomeResult);

    return res.json({ 
      ok: true, 
      message: 'Email verified successfully! You are now logged in.',
      token,
      user: user.toPublic()
    });
  } catch (err) {
    console.error('💥 OTP verification error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ error: 'User is blocked' });
    
  
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true
      });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    return res.json({ token, user: user.toPublic() });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});


router.get('/me', authMiddleware, async (req, res) => {
  return res.json({ user: req.user.toPublic() });
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    
    await sendWelcomeEmail(user);

    return res.json({ 
      ok: true, 
      message: 'Email verified successfully! You can now log in.',
      user: user.toPublic()
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('\n📬 ===== RESEND VERIFICATION REQUEST =====');
    console.log('Email:', email);
    
    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('⚠️  User not found (silent success for security):', email);
      return res.status(200).json({ success: true, message: 'If email exists, OTP will be sent' }); 
    }

    console.log('✅ User found:', user.email);
    if (user.isEmailVerified) {
      console.log('⚠️  Email already verified:', email);
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP as string
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    user.emailVerificationOTP = otp;
    user.emailVerificationOTPExpires = Date.now() + 10 * 60 * 1000;
    console.log('🔐 New OTP Generated:', otp, '| Type:', typeof otp);
    console.log('⏰ Expires at:', new Date(user.emailVerificationOTPExpires).toISOString());
    
    await user.save();
    console.log('💾 OTP saved to database');

    // Send OTP email with error handling
    console.log('📧 Attempting to send verification email...');
    console.log('   To:', user.email);
    console.log('   OTP:', otp);
    const emailResult = await sendVerificationOTPEmail(user, otp);
    console.log('📨 Email service result:', emailResult);
    
    if (!emailResult.success) {
      console.error('\n❌ ===== EMAIL SEND FAILED =====');
      console.error('Error:', emailResult.error);
      console.error('🔑 OTP stored in database for manual entry if needed');
      console.error('=============================\n');
      
      // Return error but keep the user in database
      return res.status(500).json({ 
        error: `Failed to send email: ${emailResult.error}. Contact support if issue persists.`,
        debug: process.env.NODE_ENV === 'development' ? `OTP: ${otp}` : undefined
      });
    }
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', emailResult.messageId);
    console.log('==========================================\n');

    return res.json({ 
      success: true,
      message: 'Verification OTP resent! Check your email inbox.' 
    });
  } catch (err) {
    console.error('\n💥 ===== RESEND VERIFICATION ERROR =====');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('=======================================\n');
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
});


router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔐 Password reset requested for:', email);
    
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(404).json({ 
        error: 'This email is not registered. Please check your email address or sign up for a new account.' 
      });
    }

    console.log('✅ User found:', user.email);

    
    const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase() + 
                        Math.floor(1000 + Math.random() * 9000);
    
    console.log('🔑 Generated temporary password:', tempPassword);
    
    
    user.password = tempPassword; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('💾 Password updated in database');

    
    console.log('📧 Attempting to send email...');
    const emailResult = await sendPasswordResetEmail(user, tempPassword);
    console.log('📧 Email result:', emailResult);

    return res.json({ 
      ok: true, 
      message: 'A temporary password has been sent to your email. Please check your inbox.' 
    });
  } catch (err) {
    console.error('💥 Error in request-reset:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Missing fields' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    await user.setPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


router.delete('/delete-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('🗑️ Deleting user:', email);
    
    const result = await User.deleteOne({ email: email.toLowerCase() });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User deleted successfully');
    return res.json({ ok: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
