const core = require('@actions/core');
const {
  ECSClient,
  DescribeTaskDefinitionCommand,
  RegisterTaskDefinitionCommand,
  UpdateServiceCommand
} = require('@aws-sdk/client-ecs');

async function run() {
  try {
    const templateTaskDefinition = core.getInput('template-task-definition');
    const targetTaskDefinition = core.getInput('target-task-definition');
    const containerName = core.getInput('container-name');
    const image = core.getInput('image');
    const cluster = core.getInput('cluster');
    const service = core.getInput('service');

    const ecs = new ECSClient();

    let { taskDefinition } = await ecs.send(new DescribeTaskDefinitionCommand({ taskDefinition: templateTaskDefinition }));

    let containerDefinition = taskDefinition.containerDefinitions.find(c => c.name === containerName);
    if (!containerDefinition) throw new Error(`could not find container "${containerName}" in "containerDefinitions" of template task definition`);

    containerDefinition.image = image;
    taskDefinition.family = targetTaskDefinition;

    const registerResponse = await ecs.send(new RegisterTaskDefinitionCommand(taskDefinition));
    const taskDefArn = registerResponse.taskDefinition.taskDefinitionArn;

    await ecs.send(new UpdateServiceCommand({ cluster, service, taskDefinition: taskDefArn }));
  } catch (error) {
    core.setFailed(error.message);
    core.debug(error.stack);
  }
}

run();