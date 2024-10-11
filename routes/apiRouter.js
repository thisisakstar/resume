// ============================================================
// import packages
const express = require('express');

// ============================================================
// create router
const router = express.Router();

// ============================================================
// controllers
const authControllers = require('../controllers/authControllers');
const userControllers = require('../controllers/userControllers');
const responseControllers = require('../controllers/responseControllers');
const resumeControllers = require('../controllers/resumeControllers');
const factoryControllers = require('../controllers/factoryControllers');

// ============================================================
// Models

const AppError = require('../util/appError');

// ============================================================
// routes

router.all('*', (req, res, next) => {
    next(new AppError(`undefined url ${req.originalUrl}`, 404));
});

// ============================================================
// export route
module.exports = router;
