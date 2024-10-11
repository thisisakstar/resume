// ============================================================
// import packages
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
let crypto = require('crypto');

// ============================================================
// mongoose scheme
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name should be included.'],
            default: 'Guest-' + Date.now()
        },
        email: {
            type: String,
            required: [true, 'The Email should be included.'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please Enter the valid email.']
        },

        uuuId: {
            type: String,
            required: true,
            unique: true
        },
        verified: {
            type: Boolean,
            required: true,
            default: false
        },
        password: {
            type: String,
            minlength: 8,
            required: [true, 'The Password should be included.'],
            select: false
        },

        passwordVerificationToken: String,
        passwordVerificationTokenExpires: Date,
        passwordResetToken: String,
        passwordResetTokenExpires: Date,
        passwordChangeAt: Date,
        role: {
            type: String,
            required: [true, 'role should be included.'],
            enum: ['user', 'admin'],
            default: 'user'
        }
    },
    { timestamps: true }
);

// ============================================================
// genete opt
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangeAt = Date.now() - 1000;
    next();
});

// userSchema.pre(/^find/, function (next) {
//     this.find({ active: { $ne: false } });
//     next();
// });
userSchema.methods.checkPassword = async function (userPassword, dataPassword) {
    return await bcrypt.compare(userPassword, dataPassword);
};

userSchema.methods.checkPassAfterToken = function (JWTCreatDate) {
    if (this.passwordChangeAt) {
        let getPerfectTime = parseInt(
            this.passwordChangeAt.getTime() / 1000,
            10
        );

        return JWTCreatDate < getPerfectTime;
    }
    return false;
};

userSchema.methods.verifyNewUser = function () {
    let verifyToken = crypto.randomBytes(32).toString('hex');
    this.passwordVerifyToken = crypto
        .createHash('sha256')
        .update(verifyToken)
        .digest('hex');
    this.passwordVerifyTokenExpires = Date.now() + 10 * 60 * 1000;
    return verifyToken;
};

userSchema.methods.forgotPasswordResetToken = function () {
    let resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// ============================================================
// Create user model
const userModel = mongoose.model('users', userSchema);

// ============================================================
// export model
module.exports = userModel;
