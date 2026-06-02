const { DynamoDBClient, ScanCommand, PutItemCommand, DeleteTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const tables = [
  'UrbanShield-Users',
  'UrbanShield-Reports',
  'UrbanShield-Notifications',
  'UrbanShield-ActivityLogs',
  'UrbanShield-SupportMessages'
];

async function checkTableExists(tableName) {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') return false;
    throw error;
  }
}

async function migrate() {
  for (const table of tables) {
    const destTable = `${table}-dev`;
    
    console.log(`\n--- Migrating ${table} -> ${destTable} ---`);
    
    const srcExists = await checkTableExists(table);
    if (!srcExists) {
      console.log(`Source table ${table} does not exist. Skipping...`);
      continue;
    }
    
    const destExists = await checkTableExists(destTable);
    if (!destExists) {
      console.log(`Destination table ${destTable} does not exist. Please check your deployment. Skipping...`);
      continue;
    }

    let itemsCopied = 0;
    let lastEvaluatedKey = undefined;

    do {
      const scanParams = {
        TableName: table,
        ExclusiveStartKey: lastEvaluatedKey,
      };

      const scanResult = await client.send(new ScanCommand(scanParams));
      const items = scanResult.Items || [];

      for (const item of items) {
        try {
          await client.send(new PutItemCommand({
            TableName: destTable,
            Item: item
          }));
          itemsCopied++;
        } catch (e) {
          console.error(`Failed to copy item:`, e.message);
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`Finished copying ${itemsCopied} items to ${destTable}.`);

    // Delete the old table
    console.log(`Deleting original table: ${table}...`);
    try {
      await client.send(new DeleteTableCommand({ TableName: table }));
      console.log(`Deleted ${table} successfully.`);
    } catch (e) {
      console.error(`Failed to delete ${table}:`, e.message);
    }
  }
  console.log('\nMigration completed successfully!');
}

migrate().catch(console.error);
