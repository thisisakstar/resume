const nodemailer = require('nodemailer');

const sendMail = async (options) => {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'bluelooktechnology@gmail.com',
            pass: 'cjzziehdisevvkyw'
        }
    });

    const mailOptions = {
        from: '  <uggnlsrhxzeahubnoi@nthrw.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    return await transport.sendMail(mailOptions);
};

module.exports = sendMail;
