import boto3
import pandas as pd
import io

s3_client = boto3.client("s3")

def read_csv_from_s3(bucket, key):
    """
    Reads CSV file from S3 bucket and returns a Pandas DataFrame.
    """
    response = s3_client.get_object(Bucket=bucket, Key=key)
    return pd.read_csv(io.StringIO(response["Body"].read().decode("utf-8")))