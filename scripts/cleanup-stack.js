/**
 * Script temporal para limpiar el stack CloudFormation que está en DELETE_FAILED.
 */
const { CloudFormationClient, DeleteStackCommand, DescribeStacksCommand, ListStackResourcesCommand } = require('@aws-sdk/client-cloudformation');

const cf = new CloudFormationClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function main() {
  const stackName = 'urbanshield-backend-dev';
  
  console.log(`Checking stack ${stackName}...`);
  
  try {
    const desc = await cf.send(new DescribeStacksCommand({ StackName: stackName }));
    const stack = desc.Stacks[0];
    console.log(`Stack status: ${stack.StackStatus}`);
    console.log(`Reason: ${stack.StackStatusReason || 'N/A'}`);
    
    // List all resources and their status
    const resources = await cf.send(new ListStackResourcesCommand({ StackName: stackName }));
    console.log('\nResources:');
    const retainResources = [];
    for (const r of resources.StackResourceSummaries) {
      console.log(`  ${r.LogicalResourceId}: ${r.ResourceStatus} (${r.ResourceType})`);
      if (r.ResourceStatus === 'DELETE_FAILED') {
        retainResources.push(r.LogicalResourceId);
      }
    }
    
    if (stack.StackStatus === 'DELETE_FAILED' && retainResources.length > 0) {
      console.log(`\nRetaining failed resources: ${retainResources.join(', ')}`);
      await cf.send(new DeleteStackCommand({
        StackName: stackName,
        RetainResources: retainResources,
      }));
      
      console.log('Delete initiated. Waiting...');
      let done = false;
      while (!done) {
        await new Promise(r => setTimeout(r, 5000));
        try {
          const check = await cf.send(new DescribeStacksCommand({ StackName: stackName }));
          const s = check.Stacks[0].StackStatus;
          console.log(`  Status: ${s}`);
          if (s === 'DELETE_COMPLETE') done = true;
          if (s === 'DELETE_FAILED') {
            console.error('Delete failed again!');
            const r2 = await cf.send(new ListStackResourcesCommand({ StackName: stackName }));
            for (const r of r2.StackResourceSummaries) {
              if (r.ResourceStatus === 'DELETE_FAILED') {
                console.log(`  FAILED: ${r.LogicalResourceId} - ${r.ResourceStatusReason}`);
              }
            }
            process.exit(1);
          }
        } catch (e) {
          if (e.message && e.message.includes('does not exist')) {
            console.log('Stack deleted successfully!');
            done = true;
          } else {
            throw e;
          }
        }
      }
    } else if (stack.StackStatus === 'DELETE_FAILED') {
      // No failed resources found, try deleting without retaining anything
      console.log('\nNo specific failed resources. Retrying delete...');
      await cf.send(new DeleteStackCommand({ StackName: stackName }));
      console.log('Delete initiated.');
    }
  } catch (e) {
    if (e.message && e.message.includes('does not exist')) {
      console.log('Stack does not exist. Ready for fresh deploy!');
    } else {
      console.error('Error:', e.message);
      process.exit(1);
    }
  }
}

main();
