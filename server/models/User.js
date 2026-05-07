const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    username: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
        select: false
    },
    otp: {
        type: String,
        select: false
    },
    otpExpiry: {
        type: Date
    }
});

//Hash password before saving
userSchema.pre('save', async function() {                          //userSchema save hone se hi phle hi password ko encrypt kr rhe hai
    if (!this.isModified('password')){
        return;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, 12);
});


//Compare password for Login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model('User', userSchema);
module.exports = User;