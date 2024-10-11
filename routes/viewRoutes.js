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
router.get('/', resumeControllers.getHome);

// ============================================================
// export route
module.exports = router;
