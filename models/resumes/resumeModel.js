// ============================================================
// import packages
const mongoose = require('mongoose');
const validator = require('validator');

// ============================================================
// create schema
const resumeSchema = new mongoose.Schema(
    {
        personalDetails: {
            firstName: {
                type: String,
                required: [true, 'First Name should be included.']
            },
            lastName: {
                type: String,
                required: [true, 'Last Name should be included.']
            },
            dateOfBirth: {
                type: String,
                required: [true, 'Date Of Birth should be included.']
            },
            professionalTitle: {
                type: String,
                required: [true, 'Professional Title should be included.']
            },
            objective: {
                type: String,
                required: [true, 'Objective should be included.']
            }
        },
        contactDetails: {
            email: {
                type: String,
                required: [true, 'email should be included.'],
                lowercase: true,
                validate: [validator.isEmail, 'Please Enter the valid email.']
            },
            phone: {
                type: String,
                required: [true, 'phone should be included.']
            },
            country: {
                type: String,
                required: [true, 'country should be included.']
            },
            city: {
                type: String,
                required: [true, 'city should be included.']
            },
            address: {
                type: String,
                required: [true, 'address should be included.']
            }
        },
        experience: [
            {
                achivements: {
                    type: Object
                },
                jobTitle: {
                    type: String,
                    required: [
                        true,
                        'jobTitle should be included in Exprience.'
                    ]
                },
                company: {
                    type: String,
                    required: [true, 'company should be included in Exprience.']
                },
                from: {
                    type: String,
                    required: [true, 'from should be included in Exprience.']
                },
                to: {
                    type: String,
                    required: [
                        function () {
                            return !this.present;
                        },
                        'To should be included in experience.'
                    ]
                },
                present: { type: Boolean, required: true, default: false },
                city: {
                    type: String,
                    required: [true, 'city should be included in Exprience.']
                },
                contactPerson: {
                    type: String
                },
                contactInfo: {
                    type: String
                },
                description: {
                    type: String
                }
            }
        ],

        education: [
            {
                courses: {
                    type: Object
                },
                programName: {
                    type: String,
                    required: [
                        true,
                        'Program Name should be included in Education.'
                    ]
                },
                school: {
                    type: String,
                    required: [true, 'School should be included in Education.']
                },
                from: {
                    type: String,
                    required: [true, 'From should be included in Education.']
                },
                to: {
                    type: String,
                    required: [
                        function () {
                            return !this.present;
                        },
                        'To should be included in Education.'
                    ]
                },
                present: { type: Boolean, required: true, default: false },
                percentage: {
                    type: Number,
                    required: [
                        true,
                        'percentage should be included in Education.'
                    ]
                },
                city: {
                    type: String,
                    required: [true, 'city should be included in Education.']
                }
            }
        ],
        organization: [
            {
                role: { type: Object },
                organizationName: {
                    type: String,
                    required: [true, 'Organization name should be included.']
                },
                from: {
                    type: String,
                    required: [true, 'From should be included in organization.']
                },
                to: {
                    type: String,
                    required: [
                        function () {
                            return !this.present;
                        },
                        'To should be included in organization.'
                    ]
                },
                present: { type: Boolean, default: false }
            }
        ],
        projects: [
            {
                projectName: {
                    type: String,
                    required: [
                        true,
                        'Project Name should be included. in Projects'
                    ]
                },
                from: {
                    type: String,
                    required: [true, 'From should be included. in Projects']
                },
                to: {
                    type: String,
                    required: [
                        function () {
                            return !this.present;
                        },
                        'To should be included in Projects.'
                    ]
                },
                present: { type: Boolean, required: true, default: false },
                description: {
                    type: Object
                }
            }
        ],
        certificates: [
            {
                certificateName: {
                    type: String,
                    required: [
                        true,
                        'Certificate Name should be included in Certificates.'
                    ]
                },
                from: {
                    type: String,
                    required: [true, 'From should be included in Certificates.']
                },
                to: {
                    type: String,
                    required: [
                        function () {
                            return !this.present;
                        },
                        'To should be included in certificates.'
                    ]
                },
                present: { type: Boolean, required: true, default: false },
                description: {
                    type: Object
                }
            }
        ],
        skill: {
            type: Object,
            required: [true, 'Skills should be included.']
        },
        interests: {
            type: Object,
            required: [true, 'Interests should be included.']
        },
        language: [
            {
                proficiency: {
                    type: String,
                    required: [
                        true,
                        'proficiency should be included in Language.'
                    ]
                },
                languageName: {
                    type: String,
                    required: [
                        true,
                        'Language Name should be included in Language.'
                    ]
                }
            }
        ],
        rmuId: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: mongoose.Types.ObjectId,
            required: [true, 'Userid should be included.'],
            ref: 'users',
            select: false
        },
        userEId: {
            type: String,
            required: [true, 'UserEId should be included.']
        },
        lastTemplateId: {
            type: String,
            required: [true, 'Last template id should be included.']
        },
        resumeName: {
            type: String,
            required: [true, 'Resume name should be included.']
        },
        resumeUrl: String
    },
    {
        toJSON: { virtuals: true, getters: true },
        toObject: { virtuals: true },
        timestamps: true
    }
);

resumeSchema.virtual('resume', {
    foreignField: 'temuId',
    localField: 'lastTemplateId',
    ref: 'templates'
});

resumeSchema.index(
    { 'experience.to': 1 },
    {
        partialFilterExpression: { 'experience.present': false }
    }
);

resumeSchema.index(
    { 'education.to': 1 },
    {
        partialFilterExpression: { 'education.present': false }
    }
);

resumeSchema.index(
    { 'projects.to': 1 },
    {
        partialFilterExpression: { 'projects.present': false }
    }
);

resumeSchema.index(
    { 'organization.to': 1 },
    {
        partialFilterExpression: { 'organization.present': false }
    }
);

resumeSchema.index(
    { 'certificates.to': 1 },
    {
        partialFilterExpression: { 'certificates.present': false }
    }
);

// ============================================================
// create model
const resumeModel = mongoose.model('user resumes', resumeSchema);

// ============================================================
// export model
module.exports = resumeModel;
