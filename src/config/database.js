const { env } = require('./env');

const tableNames = {
  users: env.dynamodb.usersTable,
  reports: env.dynamodb.reportsTable,
  notifications: env.dynamodb.notificationsTable,
  activityLogs: env.dynamodb.activityLogsTable,
};

/**
 * Definiciones de índices GSI para DynamoDB.
 * Usar en scripts de infraestructura (CloudFormation / CDK / Terraform).
 */
const globalSecondaryIndexes = {
  reports: [
    {
      IndexName: 'GSI_StatusCreatedAt',
      PartitionKey: 'status',
      SortKey: 'createdAt',
    },
    {
      IndexName: 'GSI_CategoryCreatedAt',
      PartitionKey: 'category',
      SortKey: 'createdAt',
    },
    {
      IndexName: 'GSI_UserIdCreatedAt',
      PartitionKey: 'userId',
      SortKey: 'createdAt',
    },
  ],
  notifications: [
    {
      IndexName: 'GSI_UserIdCreatedAt',
      PartitionKey: 'userId',
      SortKey: 'createdAt',
    },
  ],
  activityLogs: [
    {
      IndexName: 'GSI_EntityTypeCreatedAt',
      PartitionKey: 'entityType',
      SortKey: 'createdAt',
    },
  ],
};

module.exports = {
  tableNames,
  globalSecondaryIndexes,
};
