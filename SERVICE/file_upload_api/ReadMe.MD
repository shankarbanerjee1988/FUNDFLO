User → API Gateway → Auth Lambda → External Auth API
                                       ↓
                             (Validates Token)
                                       ↓
                 API Gateway (Authorized) → Lambda Function
                                       ↓
            (Upload File to S3 or Download ZIP)
                                       ↓
                               Return Response




User → (1) POST /upload → API Gateway 
     → (2) Calls authLambda → External Auth API ✅ 
     → (3) If authorized → Lambda Uploads File to S3 
     → (4) API Gateway returns Success ✅ 

User → (5) GET /download → API Gateway 
     → (6) Calls authLambda → External Auth API ✅ 
     → (7) If authorized → Lambda Generates ZIP from S3 
     → (8) API Gateway returns Download URL ✅




READ FILE
--------------
GET https://{api-id}.execute-api.{region}.amazonaws.com/prod/readfile?file_url=https://your-s3-bucket.s3.amazonaws.com/Orders/Invoices/2025-03-27/invoice.pdf


curl -X GET "https://{api-id}.execute-api.{region}.amazonaws.com/prod/readfile?file_url=https://your-s3-bucket.s3.amazonaws.com/Orders/Invoices/2025-03-27/invoice1.pdf" \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"


curl -X POST https://your-api-id.execute-api.ap-south-1.amazonaws.com/dev/upload \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"fileName": "test.txt", "fileContent": "SGVsbG8gd29ybGQ=", "folderName": "user123", "subFolderName": "documents"}'


  pip install -r requirements.txt -t .
  rm -rf .serverless .venv venv node_modules
serverless plugin install -n serverless-python-requirements
serverless deploy




pip install --upgrade pip setuptools wheel

rm -rf .venv venv
python3 -m venv venv
source venv/bin/activate  # For Mac/Linux

pip install --no-cache-dir -r requirements.txt