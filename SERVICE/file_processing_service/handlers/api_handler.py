import json
import boto3
import os
from handlers.process_file import read_file_from_s3
from handlers.save_valid import save_to_postgresql
from handlers.save_invalid import save_invalid_records
from sns_notifications import send_sns_notification

s3_client = boto3.client("s3")
SOURCE_BUCKET = os.environ["SOURCE_BUCKET"]
ERROR_BUCKET = os.environ["ERROR_BUCKET"]
SNS_SUCCESS_ARN = os.environ["SNS_SUCCESS_ARN"]
SNS_FAILURE_ARN = os.environ["SNS_FAILURE_ARN"]

def upload_handler(event, context):
    try:
        body = json.loads(event["body"])
        
        # Extract input model and file path
        input_model = body["input_model"]  # JSON metadata
        file_path = body["file_path"]      # S3 file path

        # Read the file from S3
        df = read_file_from_s3(SOURCE_BUCKET, file_path)

        # Validate and separate valid/invalid records
        valid_data, invalid_data = df[df.valid], df[~df.valid]

        # Save valid data to PostgreSQL
        success_s3_url = ""
        if not valid_data.empty:
            success_s3_url = save_to_postgresql(valid_data, input_model)

        # Save invalid data to error S3 bucket
        error_s3_url = ""
        if not invalid_data.empty:
            error_s3_url = save_invalid_records(ERROR_BUCKET, invalid_data, file_path)

        # Send notifications based on processing results
        if not invalid_data.empty:
            send_sns_notification(SNS_FAILURE_ARN, "File processed with errors", error_s3_url)
            return {"statusCode": 200, "body": json.dumps({"success": False, "error_url": error_s3_url})}

        send_sns_notification(SNS_SUCCESS_ARN, "File processed successfully", success_s3_url)
        return {"statusCode": 200, "body": json.dumps({"success": True, "success_url": success_s3_url})}

    except Exception as e:
        send_sns_notification(SNS_FAILURE_ARN, "Processing Failed", str(e))
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}