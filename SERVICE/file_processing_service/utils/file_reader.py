import pandas as pd
import json
import PyPDF2
import io
import boto3
import pyarrow.parquet as pq

s3_client = boto3.client("s3")

def read_file(bucket, key):
    """Determine file type and read accordingly."""
    response = s3_client.get_object(Bucket=bucket, Key=key)
    file_extension = key.split('.')[-1].lower()

    if file_extension == "csv":
        return pd.read_csv(io.StringIO(response["Body"].read().decode("utf-8")))
    elif file_extension in ["xls", "xlsx"]:
        return pd.read_excel(io.BytesIO(response["Body"].read()))
    elif file_extension == "json":
        return pd.DataFrame(json.load(io.BytesIO(response["Body"].read())))
    elif file_extension == "parquet":
        return pq.read_table(io.BytesIO(response["Body"].read())).to_pandas()
    elif file_extension == "pdf":
        return extract_text_from_pdf(io.BytesIO(response["Body"].read()))
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def extract_text_from_pdf(pdf_io):
    """Extract text from PDF and return as a DataFrame."""
    reader = PyPDF2.PdfReader(pdf_io)
    text_data = [page.extract_text() for page in reader.pages]
    return pd.DataFrame({"pdf_text": text_data})