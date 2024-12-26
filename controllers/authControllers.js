// ============================================================
// import packages
let jwt = require('jsonwebtoken');
let crypto = require('crypto');
let { promisify } = require('util');

// ============================================================
// import models
let userModels = require('../models/user/userModel');

// ============================================================
// import utils
let catchAsync = require('../util/catchAsync');
let AppError = require('../util/AppError');
const sendMail = require('../util/sendMail');
const encryptID = require('../util/uuid');

// ============================================================
// controllers
let signJWT = (id) => {
    return jwt.sign({ id }, process.env.JSON_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

let sendJWT = (user, statusCode, res) => {
    let token = signJWT(user._id);

    let cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };
    if (process.env.NODE_DEV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;

    return res.json({
        status: 'Success',
        statusCode: statusCode,
        token,
        data: { name: user.name, email: user.email, createAt: user.createdAt }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    req.body.uuuId = await encryptID();
    let signupUser = await userModels.create(req.body);
    // let verifyToken = await user.verifyNewUser();
    // await user.save({ validateBeforeSave: false });
    // try {
    //     let resetUrl = `${req.protocol}://${req.get(
    //         'host'
    //     )}/api/v1/user/verify/${verifyToken}`;
    //     await new Email(user, resetUrl).passwordResetEmail();
    //     res.json({
    //         status: 'Success',
    //         message: 'The message send successfull'
    //     });
    // } catch (err) {
    //     user.passwordResetToken = undefined;
    //     user.passwordResetTokenExpires = undefined;
    //     await user.save({ validateBeforeSave: false });
    //     console.log(err);
    //     return next(
    //         new AppError(
    //             'Something went worng to send your email.Please Try again later',
    //             500
    //         )
    //     );
    // }
    sendJWT(signupUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        next(new AppError('Please Enter The Email and Password', 400));
    }

    let user = await userModels.findOne({ email }).select('+password');

    if (!user || !(await user.checkPassword(password, user.password))) {
        return next(new AppError('Email or Password in invalid', 401));
    }

    sendJWT(user, 200, res);
});

exports.logout = catchAsync((req, res, next) => {
    let cookieOptions = {
        expires: new Date(),
        httpOnly: true
    };
    if (process.env.NODE_DEV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', 'logout', cookieOptions);

    return res.json({
        status: 'Success'
    });
});
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(
            new AppError(
                'You are not loggedin. //Please login and try to access the page.',
                401
            )
        );
    }

    let decode = await promisify(jwt.verify)(token, process.env.JSON_SECRET);

    let freshUser = await userModels.findById(decode.id);
    if (!freshUser) {
        return next(
            new AppError(
                'The user no longer exist. please create a new account',
                401
            )
        );
    }

    if (freshUser.checkPassAfterToken(decode.iat)) {
        return next(
            new AppError(
                'The Password changed by user in recently. please login again',
                401
            )
        );
    }
    req.user = freshUser;
    next();
});
exports.isLoggedin = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            let decode = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JSON_SECRET
            );

            let freshUser = await userModels.findById(decode.id);
            if (!freshUser) {
                return next();
            }
            if (freshUser.checkPassAfterToken(decode.iat)) {
                return next();
            }

            req.user = freshUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(`undefined url ${req.originalUrl}`, 404));
        }
        next();
    };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await userModels.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError('Please Enter the Valid Email.', 401));
    }

    let resetToken = await user.forgotPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
        let resetUrl = `${req.protocol}://${req.get(
            'host'
        )}/api/v1/user/reset-password/${resetToken}`;
        await sendMail({
            email: req.body.email,
            subject: 'Password Reset mail',
            message: resetUrl
        });
        res.json({
            status: 'Success',
            message: 'The message send successfull'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err);
        return next(
            new AppError(
                'Something went worng to send your email.Please Try again later',
                500
            )
        );
    }
});
exports.checkResetPassword = async (req, res, next) => {
    let resetToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    let user = await userModels.findOne({
        passwordResetToken: resetToken,
        passwordResetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(
            new AppError('Token is  invvalid or has expired.Please try again')
        );
    }

    return res.redirect(`/reset-password/${req.params.token}`);
};

exports.resetPassword = catchAsync(async (req, res, next) => {
    let resetToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    let user = await userModels.findOne({
        passwordResetToken: resetToken,
        passwordResetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(
            new AppError('Token is  invvalid or has expired.Please try again')
        );
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    sendJWT(user, 200, res);
});

exports.updateUserPassword = catchAsync(async (req, res, next) => {
    let user = await userModels
        .findOne({ _id: req.user._id })
        .select('+password');
    let checkUser = await user.checkPassword(
        req.body.userPassword,
        user.password
    );
    if (!checkUser) {
        return next(new AppError('Please check your current password. ', 401));
    }
    user.password = req.body.password;
    user.passwordConformation = req.body.passwordConformation;
    await user.save();
    sendJWT(user, 200, res);
});

exports.checkAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin')
        return next(new AppError('Please check your current password. ', 401));
    return res.json({ status: 'Success' });
};
