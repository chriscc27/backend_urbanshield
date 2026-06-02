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

  async subscribeEmail(topicArn, email) {
    if (!topicArn) return null;
    try {
      const { SubscribeCommand } = require('@aws-sdk/client-sns');
      const result = await this.client.send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: 'email',
          Endpoint: email,
        })
      );
      return result.SubscriptionArn;
    } catch (error) {
      logger.error('SNS subscribe failed', { error: error.message, topicArn, email });
      // fail silently so it doesn't break auth flow
      return null;
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
