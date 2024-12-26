const AppError = require('../util/AppError');

const handleCastErrorDB = (err) => {
    const message = `The URL is not valid ${err._id}:${err.value}`;
    return new AppError(message, 400);
};
const handleDublicateNameDB = (err) => {
    const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
    const message = `You are entered name ${value} is already exist. Please try another name.`;
    return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
    // console.log(JSON.stringify(err.errors));
    const data = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid Input Data.${data[0]}`;

    return new AppError(message, 400);
};
const sendErrDev = (err, req, res) => {
    // if (err.message.startsWith('E11000 duplicate key')) err.message
    if (typeof err !== 'object') {
        err = {
            message: 'Something went wrong while prossing your request',
            statusCode: 500
        };
    }
    let text = err.message;
    const keys = err?.errors
        ? Object.keys(err?.errors) && Object.keys(err?.errors).length
            ? true
            : false
        : false;
    if (keys)
        if (err?.errors[Object.keys(err?.errors)[0]]?.message) {
            err.message = err.errors[Object.keys(err.errors)[0]].message;
            text = '';
        }
    if (text?.startsWith('E11000 duplicate key')) {
        const pattern = /{(.*):/;
        const result = text.match(pattern);
        err.message = `You are entered ${result[1]} is already exist.`;
    }
    if (
        text?.startsWith('Cast to embedded failed for') ||
        text?.startsWith('Cast to Number failed for value')
    ) {
        err.message = 'Please enter the valid details..';
    }
    if (text.includes('is not a valid enum value for path')) {
        if (err?.errors[Object.keys(err.errors)[0]]?.value) {
            err.message = `${
                err.errors[Object.keys(err.errors)[0]].value
            } is invalid value.`;
        } else err.message = 'Please select the valid value.';
    }

    if (
        text.includes('less than minimum allowed') ||
        text.includes('is more than maximum allowed value')
    ) {
        if (err?.errors[Object.keys(err.errors)[0]]?.kind) {
            err.message =
                err?.errors[Object.keys(err.errors)[0]]?.kind === 'max'
                    ? `${
                          err.errors[Object.keys(err.errors)[0]].value
                      } is greater than anticipated value.`
                    : `${
                          err.errors[Object.keys(err.errors)[0]].value
                      } is lesser than anticipated value.`;
        } else err.message = 'Please select the valid value.';
    }

    if (
        req.originalUrl.startsWith('/api') ||
        req.originalUrl.startsWith('/search')
    ) {
        return res.status(err.statusCode).json({
            status: err.status,
            err: err,
            message: err.message,
            stackTrace: err.stack
        });
    }

    res.status(err.statusCode).render('error', {
        user: req.user,
        title: 'Warning Something went wrong',
        statusCode: err?.statusCode,
        msg: err.message
    });
};

// eslint-disable-next-line no-unused-vars
const handleInvalidToken = (err) =>
    new AppError('Invalid Token.Please login again...', 401);
// eslint-disable-next-line no-unused-vars
const hangleExpiredToken = (err) =>
    new AppError('Your session was expired please login again', 401);

const sendErrPro = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        return res.status(err.statusCode).json({
            status: 400,
            message: 'Something went wrong! Please try again later'
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Warning Something went wrong',
            status: err.status,
            msg: err.message
        });
    }

    return res.status(err.statusCode).render('error', {
        title: 'Warning Something went wrong',
        msg: 'Something went wrong! Please try again later'
    });
};

module.exports = (err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_DEV === 'development') {
        sendErrDev(err, req, res);
    } else if (process.env.NODE_DEV === 'production') {
        if (err.name === 'CastError') err = handleCastErrorDB(err);
        if (err.code === 11000) err = handleDublicateNameDB(err);
        if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') err = handleInvalidToken(err);
        if (err.name === 'TokenExpiredError') err = hangleExpiredToken(err);
        if (err.code === 413) err = handleLargeFileError(err);
        sendErrPro(err, req, res);
    }
    next();
};
