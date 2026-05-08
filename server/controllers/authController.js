const User = require("../models/User");
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const generateAuthToken = function(id) {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h'});
    return token;
}

exports.registerUser = async (req, res) => {
    // Logic to register a new user
    try{
        const {username, email, password } = req.body;
        if(!username || !email || !password){
            return res.status(400).json({ message: 'All fields are required' });
        }
        if(password.length < 6){
            return res.status(400).json({ message: 'Password must be at least 6 character'});
        }
        if(!/\S+@\S+\.\S+/.test(email)){
            return res.status(400).json({ message : 'Invalid mail format'});
        }

        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            return res.status(400).json({
                message: "Email already in use"
            });
        }

        if (existingUser && !existingUser.isVerified) {
            await User.deleteOne({ email });
        }

        const otp = Math.floor(10000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);   //OTP Valid for 10 minutes


        const user = await User.create({ username, email, password, otp, otpExpiry})
        res.status(201).json({
            message: "User registered successfully",
            user: {
                _id: user._id,
                email: user.email
            }
        });

        //OTP SENDING LOGIC:
        try {
            await sendEmail({
                to: email,
                subject: 'Your OTP-Code for AI COLD MAIL GENERATOR',
                text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
            })
        }catch(error){
            console.log({ message: 'Error generating OTP', error: error.message });

        }
    }
    catch(error){
        res.status(500).json({ message: 'Error registered user', error: error.message });
    }
    // res.send('User registered successfully');
}


exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp} = req.body;
        if(!email || !otp){
            return res.status(400).json({ message: 'Email and OTP are required '});
        }
        const user = await User.findOne({ email }).select('+otp +otpExpiry +isVerified');
        if(!user){
            return res.status(400).json({ message: 'User not found'});
        }
        if(user.isVerified){
            return res.status(400).json({ message: 'User already verified '});
        }
        if(user.otp !== otp){
            return res.status(400).json({ message: 'Invalid OTP'});
        }
        if(user.otpExpiry < new Date()){
            return res.status(400).json({ message: 'OTP has expired'});
        }
        user.isVerified = true;
        await user.save();
        const token = generateAuthToken(user._id);
        return res.status(200).json({ token, message: 'OTP verified successfully'});
    }
    catch(error){
        return res.status(500).json({ message: 'Error verifying OTP', error: error.message});
    }
};

exports.loginUser = async (req, res) => {
    try{
        const { email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({ message: 'Email and password are required '});
        }
        const user = await User.findOne({ email }).select('+password +isVerified');
        if(!user){
            return res.status(400).json({ message: 'User not found'});
        }
        if(!user.isVerified){
            return res.status(400).json({ message: 'User not verified. Please verify email first. '});
        }
        
        const isMatch = await user.comparePassword(password);
        if(!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        }
        const token = generateAuthToken(user._id);
        return res.status(200).json({message: 'Login successful',token, user: {
            username: user.username,
            email: user.email
        }});
    }
    catch(error){
        return res.status(500).json({ message: 'Error logging in', error: error.message});
    }
};