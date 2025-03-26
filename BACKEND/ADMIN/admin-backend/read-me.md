cd terraform
terraform init

terraform plan

terraform apply -auto-approve

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

docker build -t my-ts-app .
docker tag my-ts-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/my-ts-app:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/my-ts-app:latest


aws ecs update-service --cluster my-ts-ecs-app-cluster --service my-ts-ecs-app-service --force-new-deployment


aws ecs list-tasks --cluster my-ts-ecs-app-cluster