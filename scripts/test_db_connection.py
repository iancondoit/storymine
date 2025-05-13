#!/usr/bin/env python3

import os
import sys
import psycopg2
from dotenv import load_dotenv

def main():
    print("StoryMap Database Connection Test")
    print("=================================")
    
    # Load environment variables from .env file
    print("Loading environment variables...")
    load_dotenv()
    
    # Get database connection parameters from environment
    db_host = os.getenv("DB_HOST", "storymap-db.internal.domain")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "storymap")
    db_user = os.getenv("DB_USER", "storymine_app")
    db_password = os.getenv("DB_PASSWORD")
    db_ssl_mode = os.getenv("DB_SSL_MODE", "require")
    
    print(f"Database configuration:")
    print(f"  Host:     {db_host}")
    print(f"  Port:     {db_port}")
    print(f"  Database: {db_name}")
    print(f"  User:     {db_user}")
    print(f"  SSL Mode: {db_ssl_mode}")
    
    if not db_password:
        print("ERROR: DB_PASSWORD environment variable is not set.")
        sys.exit(1)
    
    try:
        print("\nTesting database connection...")
        
        # Configure SSL if enabled
        ssl_config = None
        if db_ssl_mode:
            ssl_config = {}
            ssl_config["sslmode"] = db_ssl_mode
            
            # Add SSL cert if provided
            ssl_cert = os.getenv("DB_SSL_ROOT_CERT")
            if ssl_cert:
                if os.path.exists(ssl_cert):
                    ssl_config["sslrootcert"] = ssl_cert
                else:
                    print(f"WARNING: SSL root certificate not found: {ssl_cert}")
        
        # Connect to the database
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password,
            **({} if ssl_config is None else ssl_config)
        )
        
        print("Connection successful!")
        
        # Test database functionality
        with conn.cursor() as cursor:
            # Check if pgvector extension is available
            cursor.execute("SELECT installed_version FROM pg_available_extensions WHERE name='vector';")
            pgvector_version = cursor.fetchone()
            if pgvector_version:
                print(f"\npgvector extension is available (version: {pgvector_version[0]})")
            else:
                print("\nWARNING: pgvector extension not found. Vector search may not be available.")
            
            # Count articles
            cursor.execute("SELECT COUNT(*) FROM articles;")
            article_count = cursor.fetchone()[0]
            print(f"\nArticles in database: {article_count:,}")
            
            # Get sample articles
            cursor.execute("""
                SELECT id, title, publication, publish_date 
                FROM articles 
                ORDER BY publish_date DESC 
                LIMIT 5;
            """)
            
            print("\nSample articles:")
            print(f"{'ID':<8} {'Title':<40} {'Publication':<20} {'Date'}")
            print(f"{'-'*8} {'-'*40} {'-'*20} {'-'*10}")
            
            for row in cursor.fetchall():
                article_id, title, publication, publish_date = row
                print(f"{article_id:<8} {title[:38]:<40} {publication[:18]:<20} {publish_date}")
            
            # Test vector search if available
            if pgvector_version:
                try:
                    print("\nTesting vector search capability...")
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'articles' AND column_name = 'content_embedding'
                        );
                    """)
                    has_embedding_column = cursor.fetchone()[0]
                    
                    if has_embedding_column:
                        cursor.execute("""
                            SELECT COUNT(*) FROM articles 
                            WHERE content_embedding IS NOT NULL;
                        """)
                        embedding_count = cursor.fetchone()[0]
                        print(f"Articles with embeddings: {embedding_count:,} ({embedding_count/article_count:.1%} of total)")
                    else:
                        print("WARNING: 'content_embedding' column not found in articles table.")
                except Exception as e:
                    print(f"Error testing vector capabilities: {e}")
        
        print("\nDatabase connection test completed successfully.")
        
    except Exception as e:
        print(f"ERROR connecting to database: {e}")
        sys.exit(1)
    finally:
        if 'conn' in locals() and conn is not None:
            conn.close()

if __name__ == "__main__":
    main() 