const { param } = require('express-validator');
const mongoose = require('mongoose');

function isValidQueryId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const validateID = [
  param('id')
    .custom((value) => {
      if (!isValidQueryId(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
];

const adminValidateID = [
  param('id')
    .custom((value) => {
      if (!isValidQueryId(value)) {
        throw new Error('Invalid ID format');
      }
      return true;
    }),
];

module.exports = { validateID, adminValidateID, isValidQueryId };
