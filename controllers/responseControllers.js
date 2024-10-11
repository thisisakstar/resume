// ============================================================
// import libraries

// ============================================================
// Import utilities

// ============================================================
// Controllers
const factoryControllers = require('./factoryControllers');

// middlewares
exports.sendEmptyJson = () => (req, res, next) =>
    res.status(200).json({
        status: 'Success'
    });

// send response data
exports.sendResponseData = () => (req, res, next) =>
    res.status(200).json({
        status: 'Success',
        docs: req.resData
    });
