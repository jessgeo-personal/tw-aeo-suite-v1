const Transaction = require('./Transaction');
const ErrorLog = require('./ErrorLog');

// Models index - centralized export
module.exports = {
  User: require('./User'),
  Analysis: require('./Analysis'),
  Usage: require('./Usage'),
  OTP: require('./OTP'),
  Stats: require('./Stats'),
  Transaction,    // ← ADD
  ErrorLog        // ← ADD
};
