const { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Client } = require('./clients');
const { env } = require('../config/env');
const { AppError } = require('../errors/AppError');
const { HTTP_STATUS } = require('../constants/httpStatus');
const logger = require('../utils/logger');

class S3Service {
  constructor() {
    this.client = getS3Client();
    this.bucket = env.s3.bucketName;
  }

  async getPresignedUploadUrl({ key, contentType }) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      });
      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: env.s3.presignedUrlExpiresIn,
      });
      const publicUrl = `https://${this.bucket}.s3.${env.aws.region}.amazonaws.com/${key}`;
      return { uploadUrl, publicUrl, key, expiresIn: env.s3.presignedUrlExpiresIn };
    } catch (error) {
      logger.error('S3 presigned URL generation failed', { error: error.message });
      throw new AppError('Failed to generate upload URL', HTTP_STATUS.SERVICE_UNAVAILABLE, 'AWS_SERVICE_ERROR');
    }
  }

  async deleteObject(key) {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      logger.warn('S3 delete failed', { key, error: error.message });
    }
  }

  async objectExists(key) {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new S3Service();
