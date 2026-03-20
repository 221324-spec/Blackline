const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: String, enum: ['Trader', 'Mentor', 'Admin'], default: 'Trader' },
  passwordHash: { type: String, required: true },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  nickName: { type: String, default: '' },
  gender: { type: String, default: '' },
  country: { type: String, default: '' },
  language: { type: String, default: '' },
  timezone: { type: String, default: '' },
  isBlocked: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  emailVerificationOTP: { type: String },
  emailVerificationOTPExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
});


UserSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};


UserSchema.methods.comparePassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};


UserSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    nickName: this.nickName,
    gender: this.gender,
    country: this.country,
    language: this.language,
    timezone: this.timezone,
    isBlocked: this.isBlocked,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', UserSchema);
