const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');

const client = new CloudFrontClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function run() {
  const callerReference = `urbanshield-frontend-${Date.now()}`;
  const originId = 'S3WebsiteOrigin';
  const domainName = 'urbanshield-frontend-dev.s3-website-us-east-1.amazonaws.com';

  const params = {
    DistributionConfig: {
      CallerReference: callerReference,
      Comment: 'UrbanShield Frontend CloudFront Distribution',
      Enabled: true,
      DefaultRootObject: 'index.html',
      Origins: {
        Quantity: 1,
        Items: [
          {
            Id: originId,
            DomainName: domainName,
            CustomOriginConfig: {
              HTTPPort: 80,
              HTTPSPort: 443,
              OriginProtocolPolicy: 'http-only',
              OriginSslProtocols: {
                Quantity: 1,
                Items: ['TLSv1.2']
              }
            }
          }
        ]
      },
      DefaultCacheBehavior: {
        TargetOriginId: originId,
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: {
          Quantity: 3,
          Items: ['GET', 'HEAD', 'OPTIONS'],
          CachedMethods: {
            Quantity: 2,
            Items: ['GET', 'HEAD']
          }
        },
        ForwardedValues: {
          QueryString: false,
          Cookies: {
            Forward: 'none'
          }
        },
        MinTTL: 0,
        DefaultTTL: 86400,
        MaxTTL: 31536000
      },
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true
      }
    }
  };

  try {
    console.log('Creating CloudFront distribution...');
    const command = new CreateDistributionCommand(params);
    const response = await client.send(command);
    console.log('Distribution created successfully!');
    console.log('DomainName:', response.Distribution.DomainName);
    console.log('Id:', response.Distribution.Id);
    console.log('Status:', response.Distribution.Status);
  } catch (error) {
    console.error('Error creating CloudFront distribution:', error);
  }
}

run();
