# AWS ECS Update Service by Template Action

A github action, that updates a service with a new image based on an existing task definition.

## Usage
```yaml
      - name: deploy to ECS
        uses: modum-io/aws-ecs-deploy-service-by-template
        with:
          image: "modumio/sample@${{ steps.docker_build.outputs.digest }}"
          template-task-definition: sample_template
          container-name: sample
          target-task-definition: sample
          cluster: app
          service: sample
```

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

## Credentials
This action relies on the [default behavior of the AWS SDK for Javascript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-your-credentials.html) to determine AWS credentials and region.

## Terraform
This action can be useful if you use Terraform to manage your task definition and don't want terraform changes to trigger a new deployment. For this you can set up a 'blueprint' template task definition and service in Terraform like this:

```hcl
resource "aws_ecs_task_definition" "sample" {
  family                   = "sample_template"
  [...]

  container_definitions    = <<TASK_DEFINITION
  [ 
    { 
      "name": "sample", 
      "image": "nginx",
      "portMappings": [ { "containerPort": 80 } ],
      "repositoryCredentials": {
      "environment": [ { "name": "SOME_ENV", "value": "some value" } ]
    }
  ]
  TASK_DEFINITION
}

resource "aws_ecs_service" "sample" {
  name            = "sample"
  [...]
  task_definition = aws_ecs_task_definition.sample.arn

  lifecycle {
    ignore_changes = [task_definition]
  }
}
```

On first deployment the service will be launched with the `sample_template` task definition. However your github action step would for each deploy make a copy of `sample_template`, change the image field, register it under the name `sample` and then update the service to use the new task definition. This separates configuration from deployment, keeps your Terraform plan "clean" and prevents accidental rollbacks, if you forget to update the image in terraform.
