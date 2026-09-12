import os
import dotenv
import MySQLdb

# Load environment variables
dotenv.load_dotenv()

db_name = os.getenv('DB_NAME', 'pkps_db')
db_user = os.getenv('DB_USER', 'root')
db_pass = os.getenv('DB_PASSWORD', '@sweetygs15')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = int(os.getenv('DB_PORT', '3306'))

print(f"Connecting to MySQL host '{db_host}' as user '{db_user}'...")

try:
    # Connect without specifying database name to create it if missing
    conn = MySQLdb.connect(
        host=db_host,
        user=db_user,
        passwd=db_pass,
        port=db_port
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    print(f"✅ Database '{db_name}' is ready on MySQL server!")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Error connecting or creating database '{db_name}': {e}")
