// ============================================================
// import packages
const path = require('path');
const fs = require('fs');

// ============================================================
// controllers
const factoryControllers = require('../controllers/factoryControllers');
const userModel = require('../models/user/userModel');
const templateModel = require('../models/templateModel');
const appReportModel = require('../models/appReportModel');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/appError');
const encryptID = require('../util/uuid');
const resumeModel = require('../models/resumes/resumeModel');

// send jsong for docs
exports.sendUserDocs = (req, res, next) =>
    res.status(200).json({ status: 'Success', user: req.user });

// assign data for update user
exports.assignDataForUpdateUser = (req, res, next) => {
    req.searchQuery = req.user._id;
    return next();
};

// update user
exports.updateUser = factoryControllers.findByIdAndUpdate(userModel, {
    need: false,
    msg: 'User not found!'
});

// assign data for create new app reporte
exports.assingDataForNewAPPReport = async (req, res, next) => {
    req.body = {
        userId: req.user._id,
        userEId: req.user.uuuId,
        title: req.body.title,
        description: req.body.description,
        uriId: await encryptID()
    };
    return next();
};

// create new reporte
exports.createNew = factoryControllers.createOne(appReportModel);

// assign data for upload file
exports.verifyUser = catchAsync(async (req, res, next) => {
    if (req.query.code !== 'pq124')
        return next(new AppError(`undefined url ${req.originalUrl}`, 404));
    else res.json({ status: 'Success', url: '/upload-templates' });
});

exports.uploadNewTemplate = catchAsync(async (req, res, next) => {
    if (
        !req.body.name ||
        !req.body.templateFileName ||
        !req.files.img ||
        !req.files.template
    )
        return next(new AppError('All the Fields should be filled', 400));

    const uid = await encryptID();
    //save file
    const pugFilePath = `${__dirname}/../html/resume/${uid}`;
    // Ensure the directory exists (create it if it doesn't)
    if (!fs.existsSync(pugFilePath)) {
        fs.mkdirSync(pugFilePath, { recursive: true });
    }

    const pugFileName = path.join(
        pugFilePath,
        `${req.body.templateFileName}.pug`
    );
    await fs.promises.writeFile(pugFileName, req.files.template[0].buffer);

    const imgFilePth = `${__dirname}/../img/resume/${uid}`;
    // Ensure the directory exists (create it if it doesn't)
    if (!fs.existsSync(imgFilePth)) {
        fs.mkdirSync(imgFilePth, { recursive: true });
    }
    const imageFileName = path.join(
        imgFilePth,
        `${req.body.templateFileName}.${
            req.files.img[0].mimetype.split('/')[1]
        }`
    );
    await fs.promises.writeFile(imageFileName, req.files.img[0].buffer);
    console.log(
        `/img/${uid}/${req.body.templateFileName}.${
            req.files.img[0].mimetype.split('/')[1]
        }`
    );
    await templateModel.create({
        name: req.body.name,
        img: `/images/resume/${uid}/${req.body.templateFileName}.${
            req.files.img[0].mimetype.split('/')[1]
        }`,
        temuId: uid,
        templateFileName: req.body.templateFileName
    });

    return res.status(200).json({ status: 'Success' });
});

// mange templte
exports.manageTemplate = catchAsync(async (req, res, next) => {
    if (req.method === 'PATCH') {
        const data = await templateModel.findOne({ temuId: req.params.id });
        if (!data) return next(new AppError('Resume not found!', 404));
        if (!req.body.name || !req.body.templateFileName)
            return next(
                new AppError(
                    'Name and Template File Name should be filled',
                    400
                )
            );
        const checkChangeName =
            data.templateFileName === req.body.templateFileName;

        const uid = req.params.id;

        const pugFilePath = `${__dirname}/../html/resume/${uid}`;
        if (!fs.existsSync(pugFilePath)) {
            fs.mkdirSync(pugFilePath, { recursive: true });
        }
        const lastIndex = data.img.lastIndexOf('.');
        const after = data.img.slice(lastIndex + 1);
        let mime = after;
        const pugFileName = path.join(
            pugFilePath,
            `${req.body.templateFileName}.pug`
        );

        const imgFilePth = `${__dirname}/../img/resume/${uid}`;
        // Ensure the directory exists (create it if it doesn't)
        if (!fs.existsSync(imgFilePth)) {
            fs.mkdirSync(imgFilePth, { recursive: true });
        }

        if (!checkChangeName) {
            const oldPath = path.join(
                pugFilePath,
                `${data.templateFileName}.pug`
            );

            fs.rename(oldPath, pugFileName, (err) => {
                if (err) {
                    return next(
                        new AppError(
                            'Something went wrong while processing you request.',
                            400
                        )
                    );
                } else {
                    console.log(uid + ' - Pug rename successfull');
                }
            });

            const oldImgPath = path.join(
                imgFilePth,
                `${data.templateFileName}.${after}`
            );
            const newImgPath = path.join(
                imgFilePth,
                `${req.body.templateFileName}.${after}`
            );

            fs.rename(oldImgPath, newImgPath, (err) => {
                if (err) {
                    console.log(err);
                    return next(
                        new AppError(
                            'Something went wrong while processing you request.',
                            400
                        )
                    );
                } else {
                    console.log(uid + ' - img rename successfull');
                }
            });
        }

        if (req.files.template) {
            const pugFileName = path.join(
                pugFilePath,
                `${req.body.templateFileName}.pug`
            );
            await fs.promises.writeFile(
                pugFileName,
                req.files.template[0].buffer
            );
        }

        if (req.files.img) {
            if (
                mime.toLowerCase() !== req.files.img[0].mimetype.split('/')[1]
            ) {
                fs.unlink(
                    path.join(imgFilePth, `${data.templateFileName}.${after}`),
                    (err) => {
                        if (err) {
                            return next(
                                new AppError(
                                    'Something went wrong while processing you request.',
                                    400
                                )
                            );
                        } else {
                            console.log('File remove successfully');
                        }
                    }
                );
            }
            const imageFileName = path.join(
                imgFilePth,
                `${req.body.templateFileName}.${
                    req.files.img[0].mimetype.split('/')[1]
                }`
            );
            mime = req.files.img[0].mimetype.split('/')[1];
            await fs.promises.writeFile(imageFileName, req.files.img[0].buffer);
        }

        const updatedData = await templateModel.findOneAndUpdate(
            { temuId: uid },
            {
                name: req.body.name,
                img: `/images/resume/${uid}/${req.body.templateFileName}.${mime}`,

                templateFileName: req.body.templateFileName
            },
            {
                runValidators: true
            }
        );
        if (!updatedData)
            return next(
                new AppError(
                    'Something went wrong while processing you request.',
                    400
                )
            );

        return res.status(200).json({ status: 'Success' });
    } else if (req.method === 'DELETE') {
        const pugFilePath = `${__dirname}/../html/resume/${req.params.id}`;
        const imgFilePth = `${__dirname}/../img/resume/${req.params.id}`;

        try {
            await fs.rmSync(pugFilePath, {
                recursive: true,
                force: true
            });
            console.log('Folder deleted!');
        } catch (err) {
            console.log(err);
            return next(
                new AppError(
                    'Something went wrong while processing you request.',
                    400
                )
            );
        }

        try {
            await fs.rmSync(imgFilePth, {
                recursive: true,
                force: true
            });
            console.log('Folder deleted!');
        } catch (err) {
            return next(
                new AppError(
                    'Something went wrong while processing you request.',
                    400
                )
            );
        }

        const updatedData = await templateModel.findOneAndDelete({
            temuId: req.params.id
        });
        if (!updatedData)
            return next(
                new AppError(
                    'Something went wrong while processing you request.',
                    400
                )
            );

        return res.status(200).json({ status: 'Success' });
    }
});

// assign data for get resume
exports.getUserResume = catchAsync(async (req, res, next) => {
    const data = await resumeModel.findOne(
        {
            userId: req.user._id,
            rmuId: req.params.resumeId
        },
        {
            _id: 0,
            'experience._id': 0,
            'education._id': 0,
            'organization._id': 0,
            'projects._id': 0,
            'certificates._id': 0,
            'language._id': 0,
            userEId: 0
        }
    );

    req.resData = data;
    return next();
});

// assing data for get my resume
exports.assignDataForGetMyResume = (req, res, next) => {
    req.searchQuery = { userId: req.user._id };
    req.queryPopulate = { path: 'resume' };
    return next();
};

// assign data for delte resume
exports.assignDataForDeleteResume = (req, res, next) => {
    req.searchQuery = { userId: req.user._id, rmuId: req.params.resumeId };
    return next();
};
