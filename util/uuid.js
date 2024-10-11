const { v4: uuidv4, v5: uuidv5 } = require('uuid');

const encryptID = async () =>
    uuidv5('id' + Date.now() * Math.random(), uuidv4());

module.exports = encryptID;
