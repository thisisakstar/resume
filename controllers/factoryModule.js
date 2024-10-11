// ============================================================
// controllers
const factoryControllers = require('../controllers/factoryControllers');

// create one
exports.createOne = (Model) => factoryControllers.createOne(Model);

// findByIdAndUpdate
exports.findByIdAndUpdate = (Model, obj) =>
    factoryControllers.findByIdAndUpdate(Model, obj);
