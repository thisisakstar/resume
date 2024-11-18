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
        resumeControllers.assignDataForUpdateProfile,
        fileUpload.uploadFiles,
        fileUpload.getPublicUrl,
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

// test template
router.get(
    '/test-template/:id',
    authControllers.protect,
    authControllers.restrictTo('admin'),
    resumeControllers.testTemplate,
    fileUpload.uploadFiles,
    responseControllers.sendResponseData()
);

// manage status of template
router.patch(
    '/template/:status/:id',
    authControllers.protect,
    authControllers.restrictTo('admin'),
    resumeControllers.assignDataforUpdate,
    factoryControllers.findOneAndUpdate(templateModel, {
        msg: 'Template not found!'
    }),
    responseControllers.sendEmptyJson()
);

router.post(
    '/upload-template',
    authControllers.protect,
    authControllers.restrictTo('admin'),
    fileUpload.uploadMultipleImages([
        { name: 'img', maxCount: 1 },
        { name: 'template', maxCount: 1 }
    ]),
    userControllers.uploadNewTemplate
);

router
    .route('/manage-template/:id')
    .patch(
        authControllers.protect,
        authControllers.restrictTo('admin'),
        fileUpload.uploadMultipleImages([
            { name: 'img', maxCount: 1 },
            { name: 'template', maxCount: 1 }
        ]),
        userControllers.manageTemplate
    )
    .delete(
        authControllers.protect,
        authControllers.restrictTo('admin'),
        userControllers.manageTemplate
    );

// ============================================================
// export route
module.exports = router;
