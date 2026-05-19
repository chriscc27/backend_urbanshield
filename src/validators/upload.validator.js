const Joi = require('joi');

const presignedUrlSchema = Joi.object({
  fileName: Joi.string().min(1).max(255).required(),
  contentType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp').required(),
  fileSize: Joi.number().integer().min(1).optional(),
});

module.exports = {
  presignedUrlSchema,
};
