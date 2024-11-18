// ============================================================
// import package
const mongoose = require('mongoose');

// ============================================================
// schema
const templateSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name should be included.']
        },
        img: {
            type: String,
            required: [true, 'Templage should be included.']
        },
        temuId: {
            type: String,
            required: [true]
        },
        templateFileName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true,
            enum: ['waiting', 'accepted', 'rejected'],
            default: 'waiting'
        },
        privateId: {
            type: String,
            required: true,
            select: false
        },
        reason: { type: String, select: false }
    },
    { timestamps: true }
);

// ============================================================
// create model
const templateModel = mongoose.model('templates', templateSchema);

// ============================================================
module.exports = templateModel;
