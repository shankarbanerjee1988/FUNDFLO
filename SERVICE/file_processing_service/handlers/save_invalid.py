import boto3
import io

s3_client = boto3.client("s3")

def save_invalid_records(bucket, df, original_key):
    error_key = f"errors/{original_key.split('/')[-1]}"
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    s3_client.put_object(Bucket=bucket, Key=error_key, Body=csv_buffer.getvalue())
    return f"https://{bucket}.s3.amazonaws.com/{error_key}"