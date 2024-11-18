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
const factoryControllers = require('../controllers/factoryControllers');

// ============================================================
// Models
const userModel = require('../models/user/userModel');
const fileUpload = require('../util/fileUpload');
const resumeModel = require('../models/resumes/resumeModel');

// ============================================================
// routes

router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logout);
router.post('/forgot-password', authControllers.forgotPassword);
router.get('/reset-password/:token', authControllers.checkResetPassword);
router.patch('/reset-password/:token', authControllers.resetPassword);

router.get('/admin', authControllers.protect, authControllers.checkAdmin);
router.get(
    '/files',
    authControllers.protect,
    authControllers.restrictTo('admin'),
    userControllers.verifyUser
);

// app report
router.post(
    '/report',
    userControllers.assingDataForNewAPPReport,
    userControllers.createNew,
    responseControllers.sendEmptyJson()
);

// get my resumes
router.get(
    '/my-resumes',
    authControllers.protect,
    userControllers.assignDataForGetMyResume,
    factoryControllers.findAllWithPopulate(resumeModel, { need: true }),
    responseControllers.sendResponseData()
);

// get resume
router
    .route('/resume/:resumeId')
    .get(
        authControllers.protect,
        userControllers.getUserResume,
        responseControllers.sendResponseData()
    )
    .delete(
        authControllers.protect,
        userControllers.assignDataForDeleteResume,
        factoryControllers.findOneAndDelete(resumeModel, {
            msg: 'Your resume not found!'
        }),
        responseControllers.sendEmptyJson()
    );

// ============================================================
// export route
module.exports = router;
