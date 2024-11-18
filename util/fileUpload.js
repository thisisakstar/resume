// ============================================================
// import packages
const multer = require('multer');
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// ============================================================
// import utlities
const AppError = require('./AppError');
const catchAsync = require('./catchAsync');

const multerStorage = multer.memoryStorage();
function multerTemplateFilter(req, file, cb) {
    if (
        file.mimetype.startsWith('image') ||
        file.originalname.endsWith('.pug') ||
        file.originalname.endsWith('.html')
    ) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not a image type please upload the image', 400),
            false
        );
    }
}
function multerFilter(req, file, cb) {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(
            new AppError('Not a image type please upload the image', 400),
            false
        );
    }
}

const uploadTemplate = multer({
    storage: multerStorage,
    fileFilter: multerTemplateFilter
});
const uploadImg = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadImg = (img) => uploadImg.single(img);

// upload multiple images
exports.uploadMultipleImages = (fields) => uploadTemplate.fields(fields);

// upload single file in aws s3
exports.uploadFiles = catchAsync(async (req, res, next) => {
    if (!req.ufile) return next();
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        }
    });

    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: req.ufile.name,
        Body: req.ufile.body,
        ContentType: req.ufile.contentType
    };

    const command = new PutObjectCommand(params);
    const data = await s3.send(command);
    if (data.$metadata.httpStatusCode !== 200)
        return next(
            new AppError('Something went wrong while uploading your file.', 400)
        );

    return next();
});

// get puplic url
exports.getPublicUrl = catchAsync(async (req, res, next) => {
    if (req.ufile) return next();
    const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        }
    });
    const bucketName = process.env.AWS_BUCKET;
    const objectKey = req.ufile.imgName;
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey
    });
    try {
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        req.tempUrl = url;
    } catch (err) {
        console.error('Error generating presigned URL:', err);
        throw err;
    }
    return next();
});
