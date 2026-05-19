const { v4: uuidv4 } = require('uuid');

const generateId = (prefix = '') => {
  const id = uuidv4();
  return prefix ? `${prefix}-${id}` : id;
};

const generateReportId = () => generateId('INC');
const generateUserId = () => generateId('USR');
const generateNotificationId = () => generateId('NTF');
const generateActivityId = () => generateId('ACT');

module.exports = {
  generateId,
  generateReportId,
  generateUserId,
  generateNotificationId,
  generateActivityId,
};
