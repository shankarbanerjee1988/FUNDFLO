from db_config import get_db_connection

def save_to_postgresql(df):
    conn = get_db_connection()
    df.to_sql("processed_data", conn, if_exists="append", index=False)
    return "PostgreSQL Inserted Successfully"