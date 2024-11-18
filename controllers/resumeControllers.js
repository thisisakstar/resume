// ============================================================
// import packages
const pug = require('pug');
const path = require('path');
const fs = require('fs');

const { chromium } = require('playwright');

// ============================================================
// import util
const catchAsync = require('../util/catchAsync');
const templateModel = require('../models/templateModel');
const AppError = require('../util/AppError');
const resumeModel = require('../models/resumes/resumeModel');
const encryptID = require('../util/uuid');
const sampleData = require('../sample_data.json');

exports.buildResume = catchAsync(async (req, res, next) => {
    let pugPath = 'resume';

    const templates = await templateModel
        .findOne({
            temuId: req.body.json.resumeData.templateId,
            status: 'accepted'
        })
        .select('+privateId');

    if (!templates)
        return next(new AppError('Resume Template not found!', 404));

    switch (pugPath) {
        case 'resume':
            const parentDirPath = path.join(__dirname, '..');
            const filename = `html/resume/${templates.privateId}/${templates.templateFileName}.pug`;
            pugPath = path.join(parentDirPath, filename);
            break;
        default:
            return;
    }

    const uid = await encryptID();
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    const fileName = `resumes/${date}/${uid}-${req.body.json.resumeData.resumeName}.pdf`;
    req.resData = {};

    if (req.user) {
        if (req.body.json.resumeData.resumeId) {
            const id = req.body.json.resumeData.resumeId;
            req.body.json.resumeData = {
                personalDetails: req.body.json.resumeData.personalDetails,
                contactDetails: req.body.json.resumeData.contactDetails,
                experience: req.body.json.resumeData.experience,
                education: req.body.json.resumeData.education,
                organization: req.body.json.resumeData.organization,
                projects: req.body.json.resumeData.projects,
                certificates: req.body.json.resumeData.certificates,
                skill: req.body.json.resumeData.skill,
                interests: req.body.json.resumeData.interests,
                language: req.body.json.resumeData.language,
                lastTemplateId: req.body.json.resumeData.templateId,
                resumeName: req.body.json.resumeData.resumeName,
                rmuId: req.body.json.resumeData.resumeId,
                resumeUrl: `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`
            };

            const resume = await resumeModel.findOneAndUpdate(
                {
                    userId: req.user._id,
                    rmuId: id
                },
                req.body.json.resumeData,
                {
                    runValidators: true
                }
            );
            if (!resume) {
                await resumeModel.create({
                    ...req.body.json.resumeData,
                    rmuId: id,
                    userId: req.user._id,
                    userEId: req.user.uuuId,
                    lastTemplateId: req.body.json.resumeData.lastTemplateId,
                    resumeUrl: `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`
                });
            }
            req.resData.id = req.body.json.resumeData.rmuId;
        } else {
            const id = await encryptID();

            await resumeModel.create({
                ...req.body.json.resumeData,
                rmuId: id,
                userId: req.user._id,
                userEId: req.user.uuuId,
                lastTemplateId: req.body.json.resumeData.templateId,
                resumeUrl: `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`
            });
            req.resData.id = id;
        }
    }
    req.body.json.resumeData.personalDetails.profileImage = req.tempUrl;
    const template = fs.readFileSync(pugPath, 'utf8');

    const compiledTemplate = pug.compile(template);
    req.body.json.resumeData.langData = {
        1: 'Beginner',
        2: 'Elementary',
        3: 'Intermediate',
        4: 'Advanced',
        5: 'Proficient'
    };
    console.log(req.body.json);
    const html = compiledTemplate(req.body.json.resumeData);

    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true
        // displayHeaderFooter: true,
    });

    req.ufile = {
        name: fileName,
        body: pdfBuffer,
        contentType: 'application/pdf'
    };

    req.resData.url = `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`;
    req.resData.name = req.body.json.resumeData.resumeName;
    return next();
});

exports.assignDataForGetAllResume = (req, res, next) => {
    req.searchQuery = {
        status: 'accepted'
    };
    return next();
};

exports.sendResponseDataForResume = (req, res, next) => {
    return res.status(200).json({
        status: 'Success',
        user: req?.user ?? false,
        docs: req.resData
    });
};

exports.getHome = (req, res, next) => {
    return res.render('index');
};

// assign data for update the profile images
exports.assignDataForUpdateProfile = (req, res, next) => {
    req.body.json = JSON.parse(req.body.json);
    req.body.json.resumeData = {
        ...req.body.json.resumeData,
        experience: Object.values(req.body.json.resumeData.experience),
        education: Object.values(req.body.json.resumeData.education),
        projects: Object.values(req.body.json.resumeData.projects),

        certificates: Object.values(req.body.json.resumeData.certificates),
        language: Object.values(req.body.json.resumeData.language)
    };

    req.ufile = {
        name: 'default/default-profile.jpeg',
        contentType: 'image/jpeg',
        imgName: `default-profile.jpeg`
    };
    if (!req.file) return next();
    const date = new Date().toLocaleDateString().replaceAll('/', '-');
    const name =
        'profile/' +
        date +
        '/' +
        Date.now() * Math.random() +
        '-' +
        req.file.originalname;
    req.ufile = {
        name,
        body: req.file.buffer,
        contentType: req.file.mimetype,
        imgName: `${name}`
    };
    req.body.json.resumeData.personalDetails.profileImage = `https://db-resumes.s3.ap-south-1.amazonaws.com/${name}`;

    return next();
};

// test template
exports.testTemplate = catchAsync(async (req, res, next) => {
    let pugPath = 'resume';

    const templates = await templateModel
        .findOne({
            temuId: req.params.id
        })
        .select('+privateId');

    if (!templates)
        return next(new AppError('Resume Template not found!', 404));

    const parentDirPath = path.join(__dirname, '..');
    const filename = `html/resume/${templates.privateId}/${templates.templateFileName}.pug`;
    pugPath = path.join(parentDirPath, filename);

    const template = fs.readFileSync(pugPath, 'utf8');

    const compiledTemplate = pug.compile(template);

    const html = compiledTemplate(sampleData);

    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    const fileName = `test-resumes/${templates.temuId}.pdf`;

    req.ufile = {
        name: fileName,
        body: pdfBuffer,
        contentType: 'application/pdf'
    };
    req.resData = {};
    req.resData.url = `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`;
    req.resData.name = templates.temuId;
    return next();
});

// assing data for updat template status
exports.assignDataforUpdate = (req, res, next) => {
    req.searchQuery = {
        temuId: req.params.id
    };
    req.body = {
        status: req.params.status === 'accept' ? 'accepted' : 'rejected'
    };
    return next();
};
