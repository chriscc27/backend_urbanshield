const { env } = require('./env');

/**
 * Configuración base para clientes AWS SDK v3.
 * Compatible con Lambda, EC2 y desarrollo local.
 */
const getAwsClientConfig = () => {
  const config = {
    region: env.aws.region,
  };

  if (env.aws.accessKeyId && env.aws.secretAccessKey) {
    config.credentials = {
      accessKeyId: env.aws.accessKeyId,
      secretAccessKey: env.aws.secretAccessKey,
    };
  }

  return config;
};

const hasAwsCredentials = () =>
  Boolean(env.aws.accessKeyId && env.aws.secretAccessKey) || !env.isDevelopment;

module.exports = {
  getAwsClientConfig,
  hasAwsCredentials,
};
