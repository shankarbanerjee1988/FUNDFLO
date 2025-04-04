echo "Installing dependencies..."
npm install

echo "Deploying with Serverless..."
serverless deploy

echo "Deployment complete!"