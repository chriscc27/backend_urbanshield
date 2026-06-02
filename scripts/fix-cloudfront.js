const { CloudFrontClient, ListDistributionsCommand, GetDistributionConfigCommand, UpdateDistributionCommand, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

const client = new CloudFrontClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function run() {
  try {
    console.log('Listing distributions...');
    const listRes = await client.send(new ListDistributionsCommand({}));
    const dist = listRes.DistributionList.Items.find(d => d.DomainName === 'dwnlwnmcbiheu.cloudfront.net');
    
    if (!dist) {
      console.log('Distribution not found');
      return;
    }
    console.log('Found dist:', dist.Id);

    console.log('Getting config...');
    const getRes = await client.send(new GetDistributionConfigCommand({ Id: dist.Id }));
    const config = getRes.DistributionConfig;
    const etag = getRes.ETag;

    // Adding SPA routing rules
    config.CustomErrorResponses = {
      Quantity: 2,
      Items: [
        {
          ErrorCode: 404,
          ResponsePagePath: '/index.html',
          ResponseCode: '200',
          ErrorCachingMinTTL: 10
        },
        {
          ErrorCode: 403,
          ResponsePagePath: '/index.html',
          ResponseCode: '200',
          ErrorCachingMinTTL: 10
        }
      ]
    };

    console.log('Updating config to support React Router (404 -> index.html)...');
    await client.send(new UpdateDistributionCommand({
      Id: dist.Id,
      IfMatch: etag,
      DistributionConfig: config
    }));
    console.log('Update complete!');

    console.log('Creating cache invalidation to force new Map code to users...');
    await client.send(new CreateInvalidationCommand({
      DistributionId: dist.Id,
      InvalidationBatch: {
        CallerReference: `invalidate-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ['/*']
        }
      }
    }));
    console.log('Invalidation created successfully!');

  } catch (e) {
    console.error(e);
  }
}
run();
