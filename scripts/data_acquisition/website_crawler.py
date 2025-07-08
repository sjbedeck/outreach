#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Website Crawler for Outreach Mate

This module handles website crawling to extract company information,
contact details, and other relevant data for lead generation.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
import random
import re
import logging
from typing import Dict, List, Optional, Any, Tuple
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WebsiteCrawler:
    """
    A robust website crawler designed to extract company information from websites.
    Includes anti-detection measures and comprehensive data extraction.
    """
    
    def __init__(self, max_pages: int = 10, max_depth: int = 2, delay_range: Tuple[float, float] = (1.0, 3.0)):
        """
        Initialize the WebsiteCrawler with configurable parameters.
        
        Args:
            max_pages: Maximum number of pages to crawl per website
            max_depth: Maximum depth of links to follow
            delay_range: Range of random delays between requests (in seconds)
        """
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.delay_range = delay_range
        self.session = self._create_session()
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ]
    
    def _create_session(self) -> requests.Session:
        """Create a requests session with retry logic"""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=0.5,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "HEAD"]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session
    
    def _get_random_user_agent(self) -> str:
        """Get a random user agent from the list"""
        return random.choice(self.user_agents)
    
    def _random_delay(self) -> None:
        """Implement a random delay between requests"""
        delay = random.uniform(self.delay_range[0], self.delay_range[1])
        time.sleep(delay)
    
    def scrape_website(self, url: str) -> Dict[str, Any]:
        """
        Main method to scrape a website and extract company information.
        
        Args:
            url: The website URL to scrape
            
        Returns:
            Dictionary containing extracted company information
        """
        logger.info(f"Starting crawl of: {url}")
        
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        visited_urls = set()
        pages_to_visit = [(url, 0)]  # (url, depth)
        all_text = []
        emails = []
        phones = []
        contact_urls = []
        social_links = {}
        technologies = []
        
        page_count = 0
        
        while pages_to_visit and page_count < self.max_pages:
            current_url, depth = pages_to_visit.pop(0)
            
            if current_url in visited_urls:
                continue
                
            visited_urls.add(current_url)
            
            try:
                # Random delay for anti-bot detection
                self._random_delay()
                
                # Make the request with a random user agent
                headers = {
                    'User-Agent': self._get_random_user_agent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0'
                }
                
                response = self.session.get(current_url, headers=headers, timeout=10)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Extract page text
                page_text = self._extract_main_content(soup)
                all_text.append(page_text)
                
                # Extract emails
                page_emails = self._extract_emails(page_text)
                emails.extend(page_emails)
                
                # Extract phones
                page_phones = self._extract_phones(page_text)
                phones.extend(page_phones)
                
                # Check if this is a contact page
                is_contact_page = self._is_contact_page(current_url, soup)
                if is_contact_page:
                    contact_urls.append(current_url)
                
                # Extract social links
                page_social_links = self._extract_social_links(soup)
                social_links.update(page_social_links)
                
                # Extract technologies
                page_technologies = self._extract_technologies(soup)
                technologies.extend(page_technologies)
                
                # Extract more links to visit if we're not too deep
                if depth < self.max_depth:
                    new_links = self._extract_internal_links(soup, url)
                    # Prioritize contact pages
                    for link in new_links:
                        if "contact" in link.lower() and link not in visited_urls:
                            pages_to_visit.insert(0, (link, depth + 1))
                        elif link not in visited_urls:
                            pages_to_visit.append((link, depth + 1))
                
                page_count += 1
                logger.info(f"Scraped page {page_count}/{self.max_pages}: {current_url}")
                
            except Exception as e:
                logger.error(f"Error scraping {current_url}: {str(e)}")
                continue
        
        # Remove duplicates
        emails = list(set(emails))
        phones = list(set(phones))
        contact_urls = list(set(contact_urls))
        technologies = list(set(technologies))
        
        # Combine all text for analysis
        combined_text = " ".join(all_text)
        
        # Extract company info
        company_info = {
            "scraped_url": url,
            "domain": urlparse(url).netloc,
            "scraped_website_text_snippet": self._summarize_text(combined_text, max_chars=1000),
            "emails": emails,
            "phones": phones,
            "contact_form_url": contact_urls[0] if contact_urls else None,
            "all_contact_urls": contact_urls,
            "social_profiles": social_links,
            "technologies_detected": technologies,
            "crawled_page_count": page_count,
            "raw_text_length": len(combined_text),
            "scraped_at": time.time()
        }
        
        logger.info(f"Completed website crawl for: {url}")
        logger.info(f"Found {len(emails)} emails, {len(phones)} phones, {len(contact_urls)} contact pages")
        
        return company_info
    
    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract the main content text from a page"""
        # Remove script and style elements
        for element in soup(["script", "style", "header", "footer", "nav"]):
            element.decompose()
        
        # Get text content
        text = soup.get_text(separator=' ', strip=True)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def _extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails
    
    def _extract_phones(self, text: str) -> List[str]:
        """Extract phone numbers from text"""
        phone_patterns = [
            r'\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}',  # International
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US/Canada
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}'  # Simple 10-digit
        ]
        
        phones = []
        for pattern in phone_patterns:
            found = re.findall(pattern, text)
            phones.extend(found)
            
        # Clean up and standardize
        cleaned_phones = []
        for phone in phones:
            # Remove non-digit characters except +
            digits_only = re.sub(r'[^\d+]', '', phone)
            if len(digits_only) >= 7:  # Only keep if it has enough digits to be a valid number
                cleaned_phones.append(digits_only)
                
        return cleaned_phones
    
    def _is_contact_page(self, url: str, soup: BeautifulSoup) -> bool:
        """Determine if a page is a contact page"""
        # Check URL
        if any(keyword in url.lower() for keyword in ['contact', 'about/contact', 'reach-us', 'get-in-touch']):
            return True
        
        # Check title and headers
        title = soup.title.string.lower() if soup.title else ''
        headers = [h.get_text().lower() for h in soup.find_all(['h1', 'h2', 'h3'])]
        
        if any(keyword in title for keyword in ['contact', 'reach us', 'get in touch']):
            return True
            
        if any(any(keyword in h for keyword in ['contact', 'reach us', 'get in touch']) for h in headers):
            return True
            
        # Check for contact forms
        form = soup.find('form')
        if form:
            form_text = form.get_text().lower()
            inputs = form.find_all('input')
            input_types = [input.get('type', '').lower() for input in inputs]
            input_names = [input.get('name', '').lower() for input in inputs]
            
            if any(keyword in form_text for keyword in ['contact', 'message', 'email us']):
                return True
                
            if 'email' in input_types or any('email' in name for name in input_names):
                return True
                
        return False
    
    def _extract_social_links(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract social media links from a page"""
        social_platforms = {
            'linkedin': [r'linkedin\.com/company/[\w-]+', r'linkedin\.com/in/[\w-]+'],
            'twitter': [r'twitter\.com/[\w-]+', r'x\.com/[\w-]+'],
            'facebook': [r'facebook\.com/[\w-]+'],
            'instagram': [r'instagram\.com/[\w-]+'],
            'youtube': [r'youtube\.com/channel/[\w-]+', r'youtube\.com/c/[\w-]+', r'youtube\.com/user/[\w-]+'],
            'github': [r'github\.com/[\w-]+']
        }
        
        social_links = {}
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            for platform, patterns in social_platforms.items():
                for pattern in patterns:
                    if re.search(pattern, href):
                        # Only keep the first link found per platform
                        if platform not in social_links:
                            social_links[platform] = href
        
        return social_links
    
    def _extract_technologies(self, soup: BeautifulSoup) -> List[str]:
        """Extract technologies used by the website"""
        technologies = []
        
        # Check meta tags and scripts for common tech
        tech_patterns = {
            'WordPress': [r'wp-content', r'wp-includes', r'wp-json'],
            'React': [r'react', r'reactjs', r'jsx'],
            'Angular': [r'ng-', r'angular'],
            'Vue.js': [r'vue', r'vuejs'],
            'Bootstrap': [r'bootstrap'],
            'jQuery': [r'jquery'],
            'Shopify': [r'shopify'],
            'Wix': [r'wix'],
            'Squarespace': [r'squarespace'],
            'Drupal': [r'drupal'],
            'Joomla': [r'joomla'],
            'Magento': [r'magento'],
            'Google Analytics': [r'google-analytics', r'gtag', r'ga.js'],
            'HubSpot': [r'hubspot', r'hs-script'],
            'Salesforce': [r'salesforce', r'force.com'],
            'Marketo': [r'marketo'],
            'Intercom': [r'intercom'],
            'Zendesk': [r'zendesk'],
            'Mailchimp': [r'mailchimp'],
            'Segment': [r'segment.io', r'segment.com'],
            'Hotjar': [r'hotjar'],
            'Google Tag Manager': [r'googletagmanager']
        }
        
        # Check in scripts
        scripts = soup.find_all('script')
        script_texts = [s.string for s in scripts if s.string]
        script_srcs = [s.get('src', '') for s in scripts]
        
        # Check in meta, link tags
        meta_tags = soup.find_all('meta')
        link_tags = soup.find_all('link')
        
        all_texts = script_texts + [str(tag) for tag in meta_tags] + [str(tag) for tag in link_tags]
        all_srcs = script_srcs + [link.get('href', '') for link in link_tags]
        
        # Check page source
        page_source = str(soup)
        
        for tech, patterns in tech_patterns.items():
            for pattern in patterns:
                # Check in sources/hrefs
                if any(re.search(pattern, src, re.IGNORECASE) for src in all_srcs if src):
                    technologies.append(tech)
                    break
                    
                # Check in text content
                if any(re.search(pattern, text, re.IGNORECASE) for text in all_texts if text):
                    technologies.append(tech)
                    break
                    
                # Check in page source
                if re.search(pattern, page_source, re.IGNORECASE):
                    technologies.append(tech)
                    break
        
        return technologies
    
    def _extract_internal_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract internal links from a page"""
        links = []
        base_domain = urlparse(base_url).netloc
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            
            # Make absolute URL
            if not href.startswith(('http://', 'https://')):
                href = urljoin(base_url, href)
            
            # Only internal links
            parsed_href = urlparse(href)
            if parsed_href.netloc == base_domain:
                # Skip anchors, javascript, etc.
                if parsed_href.scheme in ('http', 'https') and not href.endswith(('.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.doc', '.docx')):
                    links.append(href)
        
        return links
    
    def _summarize_text(self, text: str, max_chars: int = 1000) -> str:
        """Create a summarized version of text, prioritizing the beginning"""
        if len(text) <= max_chars:
            return text
            
        # Try to break at a sentence boundary
        shortened = text[:max_chars]
        last_period = shortened.rfind('.')
        
        if last_period > max_chars * 0.7:  # Only use period if it's reasonably far in
            return shortened[:last_period+1]
        else:
            return shortened

# Example usage
if __name__ == "__main__":
    crawler = WebsiteCrawler()
    result = crawler.scrape_website("https://www.example.com")
    print(f"Scraped data: {result}")