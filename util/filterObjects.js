const AppError = require('./AppError');

const filterObjects = async (obj, allowedFields, { check, next }) => {
    const filterdData = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) filterdData[el] = obj[el];
    });
  
    if (check) {
        let field = '';
        allowedFields = allowedFields.every((el) => {
            field = el;
            return Object.keys(filterdData).includes(el);
        });

        if (!allowedFields) {
            return next(new AppError(`${field} should be included.`, 400));
        }
        await Promise.all(
            Object.entries(filterdData).map(([key, value]) => {
                if (!value) {
                    let val = key.split(/(?=[A-Z])/).join(' ');
                    val = val[0].toUpperCase() + val.slice(1);
                    return next(
                        new AppError(`${val} should be included.`, 400)
                    );
                }
            })
        );
    }
    return filterdData;
};

module.exports = filterObjects;
