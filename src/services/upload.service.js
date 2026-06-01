const { v4: uuidv4 } = require('uuid');
const s3Service = require('../aws/s3.service');
const { awsInfrastructure } = require('../config/aws');
const { BadRequestError } = require('../errors/AppError');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = () => awsInfrastructure.s3.maxSizeMb * 1024 * 1024;

class UploadService {
  validateFileMetadata({ contentType, fileSize }) {
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      throw new BadRequestError('Invalid file type. Allowed: JPEG, PNG, WEBP');
    }
    if (fileSize && fileSize > MAX_FILE_SIZE_BYTES()) {
      throw new BadRequestError(`File size exceeds ${awsInfrastructure.s3.maxSizeMb}MB limit`);
    }
  }

  buildS3Key(userId, fileName) {
    const extension = fileName.split('.').pop() || 'jpg';
    return `reports/${userId}/${uuidv4()}.${extension}`;
  }

  async generatePresignedUrl({ userId, fileName, contentType, fileSize }) {
    this.validateFileMetadata({ contentType, fileSize });

    const key = this.buildS3Key(userId, fileName);

    return s3Service.getPresignedUploadUrl({ key, contentType });
  }

  async getUploadMetadata(key) {
    const exists = await s3Service.objectExists(key);
    return { key, exists };
  }
}

module.exports = new UploadService();
