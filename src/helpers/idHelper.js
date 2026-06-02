const { v4: uuidv4 } = require('uuid');

const generateId = (prefix = '') => {
  const id = uuidv4();
  return prefix ? `${prefix}-${id}` : id;
};

const normalizeCityCode = (cityCode = 'UNK') => {
  const normalized = String(cityCode || 'UNK')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return normalized || 'UNK';
};

const generateReportId = (cityCode, sequence) => {
  const normalizedCity = normalizeCityCode(cityCode);
  const paddedSequence = String(sequence || 1).padStart(2, '0');
  return `INC_${normalizedCity}_${paddedSequence}`;
};

const generateLegacyReportId = () => generateId('INC');
const generateUserId = () => generateId('USR');
const generateNotificationId = () => generateId('NTF');
const generateActivityId = () => generateId('ACT');

module.exports = {
  generateId,
  generateReportId,
  generateLegacyReportId,
  normalizeCityCode,
  generateUserId,
  generateNotificationId,
  generateActivityId,
};
