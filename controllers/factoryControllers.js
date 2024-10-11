// ============================================================
// import libraries

// ============================================================
// Import utilities
const encryptID = require('../util/uuid');
const catchAsync = require('../util/catchAsync');
const AppError = require('../util/AppError');
const filterObjects = require('../util/filterObjects');

// ============================================================
// Models
const userModel = require('../models/user/userModel');

// ============================================================
// Controllers
// find one and update
exports.findOneAndUpdate = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.findOneAndUpdate(req.searchQuery, req.body, {
            new: true,
            runValidators: true
        });
        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        return next();
    });

// find by id and update
exports.findByIdAndUpdate = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.findByIdAndUpdate(req.searchQuery, req.body, {
            new: true,
            runValidators: true
        });

        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        return next();
    });

// find one
exports.findOne = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.findOne(req.searchQuery).select(
            req.select ?? ''
        );
        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        return next();
    });

// finda ll
exports.findAll = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need, check } = props;

        const docs = await Model.find(req.searchQuery ?? {}).select(
            req.select ?? ''
        );

        if (check) {
            if (!docs.length)
                return next(
                    new AppError(
                        msg ?? 'There are no document available for you.'
                    )
                );
        }
        if (need) {
            req.resData = docs;
        }
        return next();
    });

// finda ll
exports.findAllWithPopulate = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need, check } = props;

        const docs = await Model.find(req.searchQuery ?? {})
            .select(req.select ?? '')
            .populate(req.queryPopulate);

        if (check) {
            if (!docs.length)
                return next(
                    new AppError(
                        msg ?? 'There are no document available for you.'
                    )
                );
        }
        if (need) {
            req.resData = docs;
        }
        return next();
    });

// find all
exports.findAllWithQuery = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need, check } = props;
        const [limit, skip] = [
            req.query.limit ?? 25,
            (req.query.page ?? 1) * (req.query.limit ?? 25) -
                (req.query.limit ?? 25)
        ];

        const docs = await Model.find(req.searchQuery ?? {})
            .select(req.select ?? '')
            .limit(limit)
            .skip(skip);

        if (check) {
            if (!docs.length)
                return next(
                    new AppError(
                        msg ?? 'There are no document available for you.'
                    )
                );
        }
        if (need) req.resData = docs;
        return next();
    });

// create one
exports.createOne = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.create(req.body);
        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;
        return next();
    });

// find one
exports.findOneAndDelete = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.findOneAndDelete(req.searchQuery);
        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        return next();
    });

// find one with populate
exports.findOneWithPopulate = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need, populateCheck } = props;

        const docs = await Model.findOne(req.searchQuery)
            .select(req.select ?? '')
            .populate(req.populateDoc, req.populateSelect);
        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        if (populateCheck)
            if (!docs[req.populateDoc]?._id) {
                return next(
                    new AppError(msg ?? 'Unable to process your request.')
                );
            }

        return next();
    });

// find by id and update
exports.upsertOne = (Model, props = {}) =>
    catchAsync(async (req, res, next) => {
        const { msg, need } = props;
        const docs = await Model.updateOne(req.searchQuery, req.body, {
            upsert: true,
            returnNewDocument: req.returnOldVal ? false : true,
            runValidators: true
        });

        if (!docs) {
            return next(new AppError(msg ?? 'Unable to process your request.'));
        }

        if (need) req.resData = docs;

        return next();
    });
