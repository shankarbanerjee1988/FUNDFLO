rm -rf ~/.serverless && npm cache clean --force && rm -rf .serverless && rm -rf node_modules && rm -rf package-lock.json && npm install && serverless deploy --stage uat
