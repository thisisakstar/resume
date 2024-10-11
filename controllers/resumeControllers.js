// ============================================================
// import packages
const pug = require('pug');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// ============================================================
// import util
const catchAsync = require('../util/catchAsync');
const templateModel = require('../models/templateModel');
const AppError = require('../util/appError');
const resumeModel = require('../models/resumes/resumeModel');
const encryptID = require('../util/uuid');

exports.buildResume = catchAsync(async (req, res, next) => {
    let pugPath = 'resume';
    req.body.json = JSON.parse(req.body.json);
    req.body.json.resumeData = {
        ...req.body.json.resumeData,
        experience: Object.values(req.body.json.resumeData.experience),
        education: Object.values(req.body.json.resumeData.education),
        projects: Object.values(req.body.json.resumeData.projects),
        organization: Object.values(req.body.json.resumeData.organization),
        certificates: Object.values(req.body.json.resumeData.certificates),
        language: Object.values(req.body.json.resumeData.language)
    };

    const templates = await templateModel.findOne({
        temuId: req.body.json.resumeData.templateId,
        status: 'accepted'
    });

    if (!templates)
        return next(new AppError('Resume Template not found!', 404));

    // Launch a new browser instance
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    switch (pugPath) {
        case 'resume':
            const parentDirPath = path.join(__dirname, '..');
            const filename = `html/resume/${templates.temuId}/${templates.templateFileName}.pug`;
            pugPath = path.join(parentDirPath, filename);
            break;
        default:
            return;
    }

    const uid = await encryptID();
    const fileName = `resumes/${uid}-${req.body.json.resumeData.resumeName}.pdf`;
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

    if (req.file) req.body.json.resumeData.profileImage = req.file;
    // console.log(req.body);
    const template = fs.readFileSync(pugPath, 'utf8');

    // Step 2: Compile the HTML template using pug
    const compiledTemplate = pug.compile(template);
    // req.body.resumeData.profileImage = req.file.buffer;
    // Step 4: Generate the HTML with dynamic content

    const html = compiledTemplate(req.body.json.resumeData);

    // Set the HTML content
    await page.setContent(html);

    // Customize PDF options (optional)
    const pdfOptions = {
        format: 'A4'
    };
    // Generate the PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    // // Save the PDF to a file
    // fs.writeFileSync('output.pdf', pdfBuffer);

    // Close the browser
    await browser.close();

    req.ufile = {
        name: fileName,
        body: pdfBuffer,
        contentType: 'application/pdf'
    };

    req.resData.url = `https://db-resumes.s3.ap-south-1.amazonaws.com/${fileName}`;

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
