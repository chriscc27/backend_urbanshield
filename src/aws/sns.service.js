const { PublishCommand } = require('@aws-sdk/client-sns');
const { getSnsClient } = require('./clients');
const { awsInfrastructure } = require('../config/aws');
const logger = require('../utils/logger');

class SnsService {
  constructor() {
    this.client = getSnsClient();
  }

  async publishToTopic(topicArn, message, subject = 'UrbanShield Notification') {
    if (!topicArn) {
      logger.debug('SNS topic not configured, skipping publish', { subject });
      return { messageId: null, skipped: true };
    }

    try {
      const result = await this.client.send(
        new PublishCommand({
          TopicArn: topicArn,
          Message: typeof message === 'string' ? message : JSON.stringify(message),
          Subject: subject,
        }),
      );
      return { messageId: result.MessageId, skipped: false };
    } catch (error) {
      logger.error('SNS publish failed', { error: error.message, topicArn });
      throw error;
    }
  }

  async publishEmergencyAlert(payload) {
    return this.publishToTopic(
      awsInfrastructure.sns.emergencyAlertsTopic,
      payload,
      `UrbanShield Emergency: ${payload.category || 'Alert'}`,
    );
  }

  async publishActivityNotification(payload) {
    return this.publishToTopic(
      awsInfrastructure.sns.activityNotificationsTopic,
      payload,
      'UrbanShield Activity',
    );
  }
}

module.exports = new SnsService();
