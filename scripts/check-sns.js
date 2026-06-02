const { SNSClient, ListTopicsCommand, ListSubscriptionsByTopicCommand } = require('@aws-sdk/client-sns');

const client = new SNSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function run() {
  const topicsResponse = await client.send(new ListTopicsCommand({}));
  const alertTopic = topicsResponse.Topics.find(t => t.TopicArn.includes('EmergencyAlerts'));
  
  if (!alertTopic) {
    console.log('No EmergencyAlerts topic found.');
    return;
  }
  
  console.log('Topic ARN:', alertTopic.TopicArn);
  
  const subsResponse = await client.send(new ListSubscriptionsByTopicCommand({
    TopicArn: alertTopic.TopicArn
  }));
  
  console.log('Subscriptions:');
  subsResponse.Subscriptions.forEach(sub => {
    console.log(`Endpoint: ${sub.Endpoint}, Protocol: ${sub.Protocol}, Status: ${sub.SubscriptionArn === 'PendingConfirmation' ? 'PendingConfirmation' : 'Confirmed'}`);
  });
}

run().catch(console.error);
