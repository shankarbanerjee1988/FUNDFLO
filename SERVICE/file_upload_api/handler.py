import json
import boto3
import os
import base64
import requests
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger()

# AWS S3 client
s3_client = boto3.client("s3")

# Load environment variables
BUCKET_NAME = os.getenv("BUCKET_NAME")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")

# Maximum file size (in bytes) - Example: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024

def authenticate_request(headers):
    """Authenticate using an external API before processing the request."""
    
    raw_auth_token = headers.get("Authorization", "").strip()
    logger.info(f"🔐 Raw Authorization Header: {raw_auth_token}")

    if not raw_auth_token:
        logger.warning("❌ Authentication failed: Missing Authorization token")
        return False, {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    # Ensure it starts with "Bearer "
    if not raw_auth_token.startswith("Bearer "):
        raw_auth_token = f"Bearer {raw_auth_token}"  # Auto-fix missing "Bearer "

    response = requests.get(AUTH_SERVICE_URL, headers={"Authorization": raw_auth_token})

    logger.info(f"✅ Authentication RESPONSE: {response.text}")

    if response.status_code != 200:
        logger.warning("❌ Authentication failed: Invalid token")
        return False, {"statusCode": 403, "body": json.dumps({"error": "Invalid token"})}

    return True, None

def upload_files(event, context):
    """Handle multiple file uploads with structured folder naming and logging."""
    
    logger.info("📥 Received file upload request")
    
    authenticated, error_response = authenticate_request(event["headers"])
    if not authenticated:
        return error_response

    try:
        body = json.loads(event["body"])
    except json.JSONDecodeError:
        logger.error("❌ Invalid JSON format in request body")
        return {"statusCode": 400, "body": json.dumps({"error": "Invalid JSON format"}), "headers": {"Content-Type": "application/json"}}

    files = body.get("files", [])  # List of files
    module_name = body.get("moduleName", "AR")
    enterprise = body.get("enterpriseId", "default")
    folder_name = body.get("folderName", "default")
    sub_folder = body.get("subFolderName", "uploads")
    sub_folder1 = body.get("subFolderName1", "uploads1")


    logger.info(f"📂 User Folder: {folder_name}, Subfolder: {sub_folder}, Files Count: {len(files)}")

    if not files:
        logger.warning("⚠️ No files provided in request")
        return {"statusCode": 400, "body": json.dumps({"error": "No files provided"})}

    date_str = datetime.utcnow().strftime("%Y%m%d")
    uploaded_files = []
    error_files = []
    
    for index, file in enumerate(files):
        file_name = file.get("fileName")
        file_content = file.get("fileContent")  # Base64 encoded content

        if not file_name or not file_content:
            logger.warning(f"⚠️ File at index {index} is missing file name or content")
            error_files.append({"index": index, "error": "Missing file name or content"})
            continue

        # Validate file size
        file_size = len(file_content.encode("utf-8"))
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"⚠️ File '{file_name}' exceeds max size limit (5MB)")
            error_files.append({"index": index, "fileName": file_name, "error": "File size exceeds limit (5MB)"})
            continue

        # Construct file path
        # s3_key = f"{folder_name}/{sub_folder}/{date_str}/{file_name}"
        s3_key = f"{module_name}/{enterprise}/{date_str}/{folder_name}/{sub_folder}/{sub_folder1}/{file_name}"

        try:
            logger.info(f"⬆️ Uploading file: {file_name} to {s3_key}")
            decoded_file = base64.b64decode(file_content)
            s3_client.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=decoded_file)

            uploaded_files.append({"sequence": index + 1, "filePath": s3_key})
            logger.info(f"✅ Upload success: {file_name} stored at {s3_key}")
        except Exception as e:
            logger.error(f"❌ Upload failed for {file_name}: {str(e)}")
            error_files.append({"index": index, "fileName": file_name, "error": str(e)})

    response = {
        "statusCode": 200,
        "body": json.dumps({
            "message": "File processing completed",
            "uploadedFiles": uploaded_files,
            "errorFiles": error_files
        })
    }

    logger.info(f"📤 Response: {response}")
    return response

def read_file(event, context):
    """Generate presigned URLs for multiple files, valid for 1 hour."""
    authenticated, error_response = authenticate_request(event["headers"])
    if not authenticated:
        return error_response

    query_params = event.get("queryStringParameters", {})
    file_paths = query_params.get("filePaths")  # Comma-separated file paths

    if not file_paths:
        return {"statusCode": 400, "body": json.dumps({"error": "Missing file paths"})}

    file_paths = file_paths.split(",")
    presigned_urls = []

    for file_path in file_paths:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": file_path.strip()},
            ExpiresIn=3600
        )
        presigned_urls.append({"filePath": file_path, "url": url})

    return {"statusCode": 200, "body": json.dumps({"urls": presigned_urls})}