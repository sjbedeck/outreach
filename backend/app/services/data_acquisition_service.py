from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup
import time
import random
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from app.core.config import settings

logger = logging.getLogger(__name__)

class DataAcquisitionService:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
        self.driver = None

    async def scrape_website(self, url: str) -> Dict:
        """Scrape website for company information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract basic information
            title = soup.find('title')
            meta_description = soup.find('meta', attrs={'name': 'description'})
            
            # Extract potential contact information
            contact_info = self._extract_contact_info(soup)
            
            # Extract main content
            content = self._extract_main_content(soup)
            
            return {
                'url': url,
                'title': title.text.strip() if title else '',
                'meta_description': meta_description.get('content', '') if meta_description else '',
                'contact_info': contact_info,
                'content': content,
                'scraped_at': time.time()
            }
            
        except Exception as e:
            logger.error(f"Error scraping website {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    async def scrape_linkedin_company(self, url: str) -> Dict:
        """Scrape LinkedIn company page"""
        try:
            if not self.driver:
                self._setup_driver()
            
            self.driver.get(url)
            time.sleep(random.uniform(3, 6))
            
            # Extract company information
            company_data = {
                'url': url,
                'name': self._safe_extract_text('h1'),
                'industry': self._safe_extract_text('[data-test-id="company-industry"]'),
                'employee_count': self._safe_extract_text('[data-test-id="company-employee-count-range"]'),
                'description': self._safe_extract_text('[data-test-id="company-description"]'),
                'recent_posts': self._extract_recent_posts(),
                'follower_count': self._safe_extract_text('[data-test-id="follower-count"]'),
                'scraped_at': time.time()
            }
            
            return company_data
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn company {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    async def scrape_linkedin_profile(self, url: str) -> Dict:
        """Scrape individual LinkedIn profile"""
        try:
            if not self.driver:
                self._setup_driver()
            
            self.driver.get(url)
            time.sleep(random.uniform(4, 7))
            
            # Scroll to load content
            self._scroll_to_load_content()
            
            profile_data = {
                'url': url,
                'name': self._safe_extract_text('h1'),
                'title': self._safe_extract_text('[data-test-id="profile-title"]'),
                'current_company': self._safe_extract_text('[data-test-id="current-company"]'),
                'location': self._safe_extract_text('[data-test-id="profile-location"]'),
                'summary': self._safe_extract_text('[data-test-id="summary-text"]'),
                'recent_activity': self._extract_recent_activity(),
                'accomplishments': self._extract_accomplishments(),
                'current_role_details': self._extract_current_role(),
                'past_work_summary': self._extract_work_history(),
                'scraped_at': time.time()
            }
            
            return profile_data
            
        except Exception as e:
            logger.error(f"Error scraping LinkedIn profile {url}: {str(e)}")
            return {'error': str(e), 'url': url}

    async def enrich_with_apollo(self, company_name: str, website_url: str) -> Dict:
        """Enrich company data using Apollo.io API"""
        try:
            headers = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'X-Api-Key': settings.APOLLO_API_KEY
            }
            
            # Enrich company
            company_payload = {
                'domain': website_url.replace('https://', '').replace('http://', '').split('/')[0],
                'name': company_name
            }
            
            response = requests.post(
                'https://api.apollo.io/v1/organizations/enrich',
                json=company_payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                org_data = data.get('organization', {})
                
                # Find contacts
                contacts = await self._find_apollo_contacts(org_data.get('id'), headers)
                
                return {
                    'company': {
                        'id': org_data.get('id'),
                        'name': org_data.get('name'),
                        'website_url': org_data.get('website_url'),
                        'linkedin_url': org_data.get('linkedin_url'),
                        'industry': org_data.get('industry'),
                        'employee_count': org_data.get('estimated_num_employees'),
                        'revenue': org_data.get('estimated_annual_revenue'),
                        'description': org_data.get('short_description'),
                        'founded_year': org_data.get('founded_year'),
                        'headquarters': org_data.get('headquarters'),
                        'technologies': org_data.get('technologies', [])
                    },
                    'contacts': contacts,
                    'enriched_at': time.time()
                }
            else:
                logger.error(f"Apollo API error: {response.status_code}")
                return {'error': f'Apollo API error: {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Error enriching with Apollo: {str(e)}")
            return {'error': str(e)}

    async def _find_apollo_contacts(self, company_id: str, headers: Dict) -> List[Dict]:
        """Find key contacts using Apollo.io"""
        try:
            target_titles = [
                'CEO', 'Chief Executive Officer', 'Founder', 'Co-Founder',
                'CTO', 'Chief Technology Officer', 'VP', 'Vice President',
                'Director', 'Head of', 'Manager', 'Lead'
            ]
            
            payload = {
                'organization_ids': [company_id],
                'person_titles': target_titles,
                'page': 1,
                'per_page': 5,
                'contact_email_status': ['verified']
            }
            
            response = requests.post(
                'https://api.apollo.io/v1/mixed_people/search',
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                contacts = []
                
                for person in data.get('people', []):
                    contact = {
                        'id': person.get('id'),
                        'name': person.get('name'),
                        'title': person.get('title'),
                        'email': person.get('email'),
                        'email_verified': person.get('email_status') == 'verified',
                        'linkedin_url': person.get('linkedin_url'),
                        'phone_numbers': person.get('phone_numbers', []),
                        'seniority_level': person.get('seniority'),
                        'departments': person.get('departments', [])
                    }
                    contacts.append(contact)
                
                return contacts
            else:
                logger.error(f"Apollo contacts API error: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error finding Apollo contacts: {str(e)}")
            return []

    def _setup_driver(self):
        """Setup Chrome driver for LinkedIn scraping"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    def _safe_extract_text(self, selector: str) -> str:
        """Safely extract text from element"""
        try:
            element = self.driver.find_element(By.CSS_SELECTOR, selector)
            return element.text.strip()
        except:
            return ""

    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict:
        """Extract contact information from webpage"""
        contact_info = {
            'emails': [],
            'phones': [],
            'addresses': []
        }
        
        # Extract emails
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        text = soup.get_text()
        emails = re.findall(email_pattern, text)
        contact_info['emails'] = list(set(emails))
        
        # Extract phone numbers
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        contact_info['phones'] = list(set(phones))
        
        return contact_info

    def _extract_main_content(self, soup: BeautifulSoup) -> str:
        """Extract main content from webpage"""
        # Remove script and style elements
        for element in soup(["script", "style"]):
            element.decompose()
        
        # Get text content
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        
        return text[:5000]  # Limit to 5000 characters

    def _extract_recent_posts(self) -> List[str]:
        """Extract recent posts from LinkedIn company page"""
        posts = []
        try:
            post_elements = self.driver.find_elements(By.CSS_SELECTOR, '[data-test-id="post-content"]')
            for element in post_elements[:5]:  # Get first 5 posts
                posts.append(element.text.strip())
        except:
            pass
        return posts

    def _extract_recent_activity(self) -> List[str]:
        """Extract recent activity from LinkedIn profile"""
        activities = []
        try:
            activity_elements = self.driver.find_elements(By.CSS_SELECTOR, '[data-test-id="activity-item"]')
            for element in activity_elements[:5]:  # Get first 5 activities
                activities.append(element.text.strip())
        except:
            pass
        return activities

    def _extract_accomplishments(self) -> str:
        """Extract accomplishments from LinkedIn profile"""
        try:
            accomplishments = self.driver.find_element(By.CSS_SELECTOR, '[data-test-id="accomplishments"]')
            return accomplishments.text.strip()
        except:
            return ""

    def _extract_current_role(self) -> str:
        """Extract current role details from LinkedIn profile"""
        try:
            current_role = self.driver.find_element(By.CSS_SELECTOR, '[data-test-id="current-role"]')
            return current_role.text.strip()
        except:
            return ""

    def _extract_work_history(self) -> str:
        """Extract work history from LinkedIn profile"""
        try:
            work_history = self.driver.find_element(By.CSS_SELECTOR, '[data-test-id="work-history"]')
            return work_history.text.strip()
        except:
            return ""

    def _scroll_to_load_content(self):
        """Scroll page to load dynamic content"""
        last_height = self.driver.execute_script("return document.body.scrollHeight")
        while True:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            new_height = self.driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

    def __del__(self):
        """Cleanup driver on destruction"""
        if self.driver:
            self.driver.quit()