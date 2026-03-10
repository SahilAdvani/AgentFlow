@echo off
echo Building Docker Images...

cd "%~dp0"
docker-compose build

echo Tagging and Pushing Backend...
docker tag dynamicphillic/agentflow-backend:latest dynamicphillic/agentflow-backend:latest
docker push dynamicphillic/agentflow-backend:latest

echo Tagging and Pushing Frontend...
docker tag dynamicphillic/agentflow-frontend:latest dynamicphillic/agentflow-frontend:latest
docker push dynamicphillic/agentflow-frontend:latest

echo Done!
