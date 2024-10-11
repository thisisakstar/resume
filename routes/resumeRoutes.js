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
const userModel = require('../models/user/userModel');
const templateModel = require('../models/templateModel');
const fileUpload = require('../util/fileUpload');

// ============================================================
// routes
// get resumes
router.get(
    '/',
    authControllers.isLoggedin,
    resumeControllers.assignDataForGetAllResume,
    factoryControllers.findAll(templateModel, { need: true }),
    resumeControllers.sendResponseDataForResume
);
router
    .route('/build')
    .post(
        authControllers.isLoggedin,
        fileUpload.uploadImg('img'),
        resumeControllers.buildResume,
        fileUpload.uploadFiles,
        responseControllers.sendResponseData()
    );

// get resumes
router.get(
    '/resumes',
    authControllers.protect,
    authControllers.restrictTo('admin'),
    factoryControllers.findAll(templateModel, { need: true }),
    responseControllers.sendResponseData()
);

// ============================================================
// export route
module.exports = router;
