#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Apollo.io API Integration for Outreach Mate

This module handles integration with Apollo.io API for company data enrichment
and contact discovery.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import requests
import logging
import time
import json
from typing import Dict, List, Optional, Any, Union, Tuple
import re
from ratelimit import limits, sleep_and_retry
from backoff import on_exception, expo
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Apollo.io API rate limits (3 requests per second, 10000 per day)
APOLLO_RATE_LIMIT = 3  # requests
APOLLO_RATE_PERIOD = 1  # second

class ApolloIntegration:
    """
    Apollo.io API integration for company data enrichment and
    key contact discovery.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the Apollo integration.
        
        Args:
            api_key: Apollo.io API key
        """
        self.api_key = api_key
        self.base_url = "https://api.apollo.io/v1"
        self.headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": self.api_key
        }
    
    @sleep_and_retry
    @limits(calls=APOLLO_RATE_LIMIT, period=APOLLO_RATE_PERIOD)
    @on_exception(expo, (requests.exceptions.RequestException, httpx.HTTPError), max_tries=3)
    def _make_request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict:
        """
        Make a rate-limited request to the Apollo.io API.
        
        Args:
            endpoint: API endpoint to call
            method: HTTP method (GET, POST)
            data: Data for POST requests
            
        Returns:
            JSON response as dictionary
        """
        url = f"{self.base_url}/{endpoint}"
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self.headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=self.headers, json=data, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Apollo API request failed: {str(e)}")
            raise
    
    def enrich_company(self, domain: str = None, name: str = None) -> Dict[str, Any]:
        """
        Enrich company data using Apollo.io API.
        
        Args:
            domain: Company website domain (preferred method)
            name: Company name (fallback if domain not available)
            
        Returns:
            Enriched company data
        """
        if not domain and not name:
            raise ValueError("Either domain or name must be provided")
            
        logger.info(f"Enriching company data for {'domain: ' + domain if domain else 'name: ' + name}")
        
        data = {}
        if domain:
            data["domain"] = self._clean_domain(domain)
        if name:
            data["name"] = name
        
        try:
            response = self._make_request("organizations/enrich", method="POST", data=data)
            
            if not response.get("organization"):
                logger.warning(f"No organization data found for {'domain: ' + domain if domain else 'name: ' + name}")
                return {"error": "No organization found", "input": data}
            
            logger.info(f"Successfully enriched company data for {response.get('organization', {}).get('name', 'Unknown')}")
            return response
            
        except Exception as e:
            logger.error(f"Error enriching company: {str(e)}")
            return {"error": str(e), "input": data}
    
    def find_contacts(self, company_id: str = None, domain: str = None, name: str = None,
                      titles: Optional[List[str]] = None, seniority: Optional[List[str]] = None,
                      limit: int = 5) -> Dict[str, Any]:
        """
        Find key contacts at a company using Apollo.io API.
        
        Args:
            company_id: Apollo company ID (preferred)
            domain: Company website domain (alternative)
            name: Company name (fallback)
            titles: List of target titles to filter by (e.g., 'CEO', 'CTO')
            seniority: List of seniority levels (e.g., 'director', 'vp', 'c_suite')
            limit: Maximum number of contacts to return
            
        Returns:
            Dictionary with contact data
        """
        if not company_id and not domain and not name:
            raise ValueError("Either company_id, domain or name must be provided")
            
        logger.info(f"Finding contacts for company: {company_id or domain or name}")
        
        # Set default target titles if none provided
        if not titles:
            titles = [
                "CEO", "Chief Executive Officer", 
                "CTO", "Chief Technology Officer",
                "CMO", "Chief Marketing Officer",
                "CFO", "Chief Financial Officer",
                "COO", "Chief Operating Officer",
                "Founder", "Co-Founder",
                "VP", "Vice President",
                "Director", "Head of",
                "Manager"
            ]
        
        # Set default seniority if none provided
        if not seniority:
            seniority = ["director", "vp", "c_suite", "founder"]
        
        data = {
            "page": 1,
            "per_page": limit,
            "contact_email_status": ["verified"],  # Only return contacts with verified emails
            "person_titles": titles,
            "person_seniorities": seniority
        }
        
        # Add company identifier
        if company_id:
            data["organization_ids"] = [company_id]
        elif domain:
            data["q_organization_domains"] = [self._clean_domain(domain)]
        elif name:
            data["q_organization_name"] = name
        
        try:
            response = self._make_request("mixed_people/search", method="POST", data=data)
            
            people = response.get("people", [])
            if not people:
                logger.warning(f"No contacts found for company: {company_id or domain or name}")
                return {"error": "No contacts found", "input": data}
            
            logger.info(f"Found {len(people)} contacts for company")
            
            # Process contact data into a more usable format
            contacts = []
            for person in people:
                # Extract LinkedIn URL
                linkedin_url = None
                for account in person.get("account_links", []):
                    if account.get("type") == "linkedin_url":
                        linkedin_url = account.get("url")
                        break
                
                # Extract contact data
                contact = {
                    "id": person.get("id"),
                    "name": person.get("name"),
                    "first_name": person.get("first_name"),
                    "last_name": person.get("last_name"),
                    "title": person.get("title"),
                    "email": person.get("email"),
                    "email_status": person.get("email_status"),
                    "linkedin_url": linkedin_url,
                    "phone_numbers": person.get("phone_numbers", []),
                    "seniority": person.get("seniority"),
                    "departments": person.get("departments", [])
                }
                
                contacts.append(contact)
            
            return {
                "company_id": company_id,
                "company_domain": domain,
                "company_name": name,
                "total_contacts": response.get("pagination", {}).get("total", 0),
                "contacts": contacts
            }
            
        except Exception as e:
            logger.error(f"Error finding contacts: {str(e)}")
            return {"error": str(e), "input": data}
    
    def enrich_company_and_contacts(self, domain: str = None, name: str = None,
                                    max_contacts: int = 5) -> Dict[str, Any]:
        """
        Combined method to enrich company data and find key contacts in one call.
        
        Args:
            domain: Company website domain (preferred)
            name: Company name (fallback)
            max_contacts: Maximum number of contacts to return
            
        Returns:
            Combined company and contact enrichment data
        """
        # Step 1: Enrich the company
        company_data = self.enrich_company(domain=domain, name=name)
        
        if company_data.get("error"):
            return company_data
            
        organization = company_data.get("organization", {})
        org_id = organization.get("id")
        
        # Step 2: Find contacts for the company
        if org_id:
            contacts_data = self.find_contacts(
                company_id=org_id,
                limit=max_contacts
            )
        else:
            contacts_data = self.find_contacts(
                domain=domain,
                name=name,
                limit=max_contacts
            )
        
        # Step 3: Combine the data
        result = {
            "company": organization,
            "contacts": contacts_data.get("contacts", []),
            "enriched_at": time.time()
        }
        
        return result
    
    def _clean_domain(self, url: str) -> str:
        """Clean a URL to extract just the domain"""
        # Remove http://, https://, and www.
        domain = re.sub(r'^https?://', '', url)
        domain = re.sub(r'^www\.', '', domain)
        
        # Remove path, query string, etc.
        domain = domain.split('/')[0]
        
        return domain

# Example usage
if __name__ == "__main__":
    # Replace with your actual Apollo.io API key
    apollo = ApolloIntegration(api_key="your_apollo_api_key")
    
    # Example: Enrich a company and find contacts
    result = apollo.enrich_company_and_contacts(domain="example.com")
    print(json.dumps(result, indent=2))