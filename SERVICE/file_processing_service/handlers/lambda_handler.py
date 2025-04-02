import json
import datetime
from handlers.process_file import read_file_from_s3
from handlers.save_valid import save_to_postgresql
from handlers.save_invalid import save_invalid_records
from db_config import get_db_connection
from sns_notifications import send_sns_notification

SOURCE_BUCKET = "your-source-bucket"
ERROR_BUCKET = "your-error-bucket"

SNS_SUCCESS_ARN = "arn:aws:sns:us-east-1:123456789012:CsvProcessingSuccess"
SNS_FAILURE_ARN = "arn:aws:sns:us-east-1:123456789012:CsvProcessingFailure"

def lambda_handler(event, context):
    try:
        s3_object = event["Records"][0]["s3"]
        s3_bucket = s3_object["bucket"]["name"]
        s3_key = s3_object["object"]["key"]
        input_s3_url = f"https://{s3_bucket}.s3.amazonaws.com/{s3_key}"

        df = read_file_from_s3(s3_bucket, s3_key)
        valid_data, invalid_data = df[df.valid], df[~df.valid]  # Assuming validation logic is handled

        success_s3_url = ""
        if not valid_data.empty:
            success_s3_url = save_to_postgresql(valid_data)

        error_s3_url = ""
        if not invalid_data.empty:
            error_s3_url = save_invalid_records(ERROR_BUCKET, invalid_data, s3_key)

        store_file_logs(input_s3_url, success_s3_url, error_s3_url)

        if not invalid_data.empty():
            send_sns_notification(SNS_FAILURE_ARN, "File Processed with Errors", error_s3_url)
            return {"statusCode": 200, "body": json.dumps({"success": False, "error_url": error_s3_url})}

        send_sns_notification(SNS_SUCCESS_ARN, "File Processed Successfully", success_s3_url)
        return {"statusCode": 200, "body": json.dumps({"success": True, "success_url": success_s3_url})}

    except Exception as e:
        send_sns_notification(SNS_FAILURE_ARN, "Processing Failed", str(e))
        return {"statusCode": 500, "body": json.dumps(str(e))}

def store_file_logs(input_url, success_url, error_url):
    conn = get_db_connection()
    query = "INSERT INTO file_logs (input_file_url, success_file_url, error_file_url, processed_at) VALUES (%s, %s, %s, %s)"
    conn.execute(query, (input_url, success_url, error_url, datetime.datetime.now()))