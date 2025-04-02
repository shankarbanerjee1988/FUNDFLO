import psycopg2
from sqlalchemy import create_engine

DB_CONFIG = {
    "host": "your-db-host",
    "database": "your-db-name",
    "user": "your-db-user",
    "password": "your-db-password"
}

def get_db_connection():
    engine = create_engine(f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}/{DB_CONFIG['database']}")
    return engine.connect()