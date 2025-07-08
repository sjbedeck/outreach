#!/usr/bin/env python3

"""
Data Migration Script for Outreach Mate

This script handles database migrations and data setup for the Outreach Mate application.
"""

import os
import sys
import asyncio
import logging
from typing import List, Dict
import json

# Add the parent directory to the path so we can import from the backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.models.database import database, engine, Base
from app.core.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample data for testing
SAMPLE_USERS = [
    {
        'email': 'demo@outreachmate.com',
        'password_hash': '$2b$12$dummy_hash_for_demo',
        'first_name': 'Demo',
        'last_name': 'User',
        'company_name': 'Outreach Mate Demo'
    }
]

SAMPLE_COMPANIES = [
    {
        'name': 'Upbuild',
        'website_url': 'https://www.upbuild.com',
        'linkedin_url': 'https://linkedin.com/company/upbuild',
        'industry': 'Leadership Coaching',
        'employee_count_range': '10-50',
        'revenue_range': '$1M-10M',
        'description': 'Leadership coaching and development company',
        'mission_vision_summary': 'Upbuild helps leaders shed ego, foster trust, and access true selves through coaching, mediation, and Enneagram work.',
        'technologies_used': ['HubSpot', 'Salesforce', 'Slack'],
        'data_quality_score': 85
    },
    {
        'name': 'TechCorp',
        'website_url': 'https://www.techcorp.com',
        'linkedin_url': 'https://linkedin.com/company/techcorp',
        'industry': 'Software Development',
        'employee_count_range': '50-200',
        'revenue_range': '$10M-50M',
        'description': 'Enterprise software solutions provider',
        'mission_vision_summary': 'TechCorp develops innovative software solutions that help businesses streamline operations and drive growth.',
        'technologies_used': ['AWS', 'React', 'Node.js', 'PostgreSQL'],
        'data_quality_score': 92
    },
    {
        'name': 'HealthPlus',
        'website_url': 'https://www.healthplus.com',
        'linkedin_url': 'https://linkedin.com/company/healthplus',
        'industry': 'Healthcare',
        'employee_count_range': '200-500',
        'revenue_range': '$50M-100M',
        'description': 'Healthcare technology and services',
        'mission_vision_summary': 'HealthPlus leverages technology to improve patient outcomes and streamline healthcare delivery.',
        'technologies_used': ['Python', 'Django', 'React', 'AWS'],
        'data_quality_score': 78
    }
]

SAMPLE_CONTACTS = [
    {
        'name': 'John Smith',
        'title': 'CEO',
        'email_primary': 'john@upbuild.com',
        'linkedin_url': 'https://linkedin.com/in/johnsmith',
        'profile_summary': 'Experienced CEO with 15+ years in leadership coaching',
        'current_work_summary': 'Leading Upbuild as CEO, focusing on executive coaching programs',
        'seniority_level': 'C-Level'
    },
    {
        'name': 'Sarah Johnson',
        'title': 'CTO',
        'email_primary': 'sarah@techcorp.com',
        'linkedin_url': 'https://linkedin.com/in/sarahjohnson',
        'profile_summary': 'Technology leader with expertise in scalable systems',
        'current_work_summary': 'Overseeing technical strategy and product development at TechCorp',
        'seniority_level': 'C-Level'
    },
    {
        'name': 'Dr. Michael Brown',
        'title': 'Chief Medical Officer',
        'email_primary': 'michael@healthplus.com',
        'linkedin_url': 'https://linkedin.com/in/michaelbrown',
        'profile_summary': 'Healthcare executive with clinical and business expertise',
        'current_work_summary': 'Driving clinical excellence and innovation at HealthPlus',
        'seniority_level': 'C-Level'
    }
]

async def create_tables():
    """Create database tables"""
    try:
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Error creating tables: {str(e)}")
        raise

async def insert_sample_data():
    """Insert sample data for testing"""
    try:
        await database.connect()
        
        # Insert sample users
        logger.info("Inserting sample users...")
        for user in SAMPLE_USERS:
            query = """
                INSERT INTO users (email, password_hash, first_name, last_name, company_name)
                VALUES (:email, :password_hash, :first_name, :last_name, :company_name)
                ON CONFLICT (email) DO NOTHING
            """
            await database.execute(query, user)
        
        # Get user ID for foreign key relationships
        user_result = await database.fetch_one("SELECT id FROM users WHERE email = :email", {"email": "demo@outreachmate.com"})
        user_id = user_result['id'] if user_result else None
        
        if user_id:
            # Insert sample companies
            logger.info("Inserting sample companies...")
            for company in SAMPLE_COMPANIES:
                query = """
                    INSERT INTO companies (user_id, name, website_url, linkedin_url, industry, 
                                         employee_count_range, revenue_range, description, 
                                         mission_vision_summary, technologies_used, data_quality_score)
                    VALUES (:user_id, :name, :website_url, :linkedin_url, :industry, 
                            :employee_count_range, :revenue_range, :description, 
                            :mission_vision_summary, :technologies_used, :data_quality_score)
                    ON CONFLICT (user_id, name) DO NOTHING
                """
                await database.execute(query, {**company, 'user_id': user_id})
            
            # Insert sample contacts
            logger.info("Inserting sample contacts...")
            companies = await database.fetch_all("SELECT id, name FROM companies WHERE user_id = :user_id", {"user_id": user_id})
            
            for i, contact in enumerate(SAMPLE_CONTACTS):
                if i < len(companies):
                    company_id = companies[i]['id']
                    query = """
                        INSERT INTO contacts (company_id, user_id, name, title, email_primary, 
                                            linkedin_url, profile_summary, current_work_summary, 
                                            seniority_level)
                        VALUES (:company_id, :user_id, :name, :title, :email_primary, 
                                :linkedin_url, :profile_summary, :current_work_summary, 
                                :seniority_level)
                        ON CONFLICT (company_id, email_primary) DO NOTHING
                    """
                    await database.execute(query, {
                        **contact, 
                        'company_id': company_id, 
                        'user_id': user_id
                    })
        
        logger.info("✅ Sample data inserted successfully")
        
    except Exception as e:
        logger.error(f"❌ Error inserting sample data: {str(e)}")
        raise
    finally:
        await database.disconnect()

async def run_migrations():
    """Run database migrations"""
    try:
        logger.info("🗄️  Running database migrations...")
        
        # Create tables
        await create_tables()
        
        # Insert sample data
        await insert_sample_data()
        
        logger.info("✅ All migrations completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {str(e)}")
        sys.exit(1)

def main():
    """Main function"""
    print("🚀 Starting Outreach Mate Data Migration...")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    
    # Run migrations
    asyncio.run(run_migrations())
    
    print("🎉 Migration completed successfully!")
    print("\n📋 Sample data added:")
    print("   - Demo user: demo@outreachmate.com")
    print("   - 3 Sample companies with contacts")
    print("   - Ready for testing!")

if __name__ == "__main__":
    main()