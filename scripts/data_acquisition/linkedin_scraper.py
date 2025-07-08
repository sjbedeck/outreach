#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
LinkedIn Scraper for Outreach Mate

This module handles LinkedIn scraping to extract company information
and individual profile data with advanced anti-detection measures.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import time
import random
import json
import logging
import os
from typing import Dict, List, Optional, Any, Union, Tuple
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from fake_useragent import UserAgent

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class LinkedInCredentials:
    """LinkedIn login credentials"""
    username: str
    password: str

@dataclass
class CompanyData:
    """Data structure for LinkedIn company information"""
    name: str
    url: str
    industry: Optional[str] = None
    website: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None
    founded: Optional[str] = None
    specialties: Optional[List[str]] = None
    description: Optional[str] = None
    follower_count: Optional[str] = None
    employee_count: Optional[str] = None
    recent_updates: Optional[List[Dict[str, str]]] = None
    logo_url: Optional[str] = None

@dataclass
class ProfileActivity:
    """Data structure for LinkedIn profile activity"""
    date: str
    content: str
    likes: Optional[int] = None
    comments: Optional[int] = None
    url: Optional[str] = None

@dataclass
class ProfileData:
    """Data structure for LinkedIn profile information"""
    name: str
    url: str
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    experience: Optional[List[Dict[str, str]]] = None
    education: Optional[List[Dict[str, str]]] = None
    skills: Optional[List[str]] = None
    recommendations: Optional[List[Dict[str, str]]] = None
    accomplishments: Optional[List[Dict[str, str]]] = None
    recent_activity: Optional[List[ProfileActivity]] = None
    contact_info: Optional[Dict[str, str]] = None
    profile_picture_url: Optional[str] = None

class LinkedInScraper:
    """
    Advanced LinkedIn Scraper with robust anti-detection measures.
    Can scrape both company pages and individual profiles.
    """
    
    def __init__(self, credentials: LinkedInCredentials, headless: bool = True, 
                 use_proxy: bool = False, proxy_url: Optional[str] = None):
        """
        Initialize the LinkedIn Scraper.
        
        Args:
            credentials: LinkedIn login credentials
            headless: Run in headless mode (no visible browser)
            use_proxy: Whether to use a proxy
            proxy_url: Proxy URL if use_proxy is True
        """
        self.credentials = credentials
        self.headless = headless
        self.use_proxy = use_proxy
        self.proxy_url = proxy_url
        self.driver = None
        self.logged_in = False
        self.user_agent = UserAgent().random
        
        # Parameters for human mimicry
        self.scroll_speed_range = (300, 700)  # pixels
        self.scroll_pause_range = (0.8, 2.5)  # seconds
        self.action_pause_range = (1.0, 3.0)  # seconds
        self.page_load_timeout = 30  # seconds
        
        # Initialize the storage for cookies
        self.cookies_file = os.path.join(os.path.dirname(__file__), 'linkedin_cookies.json')
    
    def _initialize_driver(self) -> None:
        """Initialize the Selenium WebDriver with anti-detection measures"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Anti-detection measures
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument(f"user-agent={self.user_agent}")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-browser-side-navigation")
        chrome_options.add_argument("--disable-features=IsolateOrigins,site-per-process")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        if self.use_proxy and self.proxy_url:
            chrome_options.add_argument(f'--proxy-server={self.proxy_url}')
        
        # Create driver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.set_page_load_timeout(self.page_load_timeout)
        
        # Additional anti-detection measures
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # Set window size to appear more human-like
        self.driver.set_window_size(1366, 768)
    
    def _random_pause(self, min_seconds: float = None, max_seconds: float = None) -> None:
        """Pause for a random amount of time to mimic human behavior"""
        if min_seconds is None:
            min_seconds = self.action_pause_range[0]
        if max_seconds is None:
            max_seconds = self.action_pause_range[1]
            
        pause_time = random.uniform(min_seconds, max_seconds)
        time.sleep(pause_time)
    
    def _human_like_scroll(self, scroll_count: int = 3) -> None:
        """Scroll down the page in a human-like manner"""
        scroll_height = self.driver.execute_script("return document.body.scrollHeight")
        current_position = 0
        
        for _ in range(scroll_count):
            # Calculate a random scroll amount
            scroll_amount = random.randint(
                self.scroll_speed_range[0],
                self.scroll_speed_range[1]
            )
            
            current_position += scroll_amount
            if current_position > scroll_height:
                current_position = scroll_height
            
            # Scroll to the new position
            self.driver.execute_script(f"window.scrollTo(0, {current_position});")
            
            # Random pause between scrolls
            pause_time = random.uniform(
                self.scroll_pause_range[0],
                self.scroll_pause_range[1]
            )
            time.sleep(pause_time)
            
            # Update scroll height as content might be dynamically loaded
            scroll_height = self.driver.execute_script("return document.body.scrollHeight")
    
    def _save_cookies(self) -> None:
        """Save cookies to a file"""
        if self.driver:
            with open(self.cookies_file, 'w') as f:
                json.dump(self.driver.get_cookies(), f)
    
    def _load_cookies(self) -> bool:
        """Load cookies from file if available"""
        if os.path.exists(self.cookies_file):
            try:
                with open(self.cookies_file, 'r') as f:
                    cookies = json.load(f)
                
                # Visit LinkedIn first to set cookies
                self.driver.get('https://www.linkedin.com/')
                self._random_pause(1.0, 2.0)
                
                for cookie in cookies:
                    self.driver.add_cookie(cookie)
                
                return True
            except Exception as e:
                logger.warning(f"Could not load cookies: {e}")
                
        return False
    
    def login(self) -> bool:
        """
        Log in to LinkedIn using provided credentials.
        Uses cookie caching to reduce login frequency.
        
        Returns:
            True if login successful, False otherwise
        """
        if self.logged_in:
            return True
            
        if not self.driver:
            self._initialize_driver()
        
        try:
            # Try to use saved cookies first
            if self._load_cookies():
                # Navigate to LinkedIn homepage to validate login
                self.driver.get('https://www.linkedin.com/feed/')
                self._random_pause(2.0, 4.0)
                
                # Check if we're logged in
                if "feed" in self.driver.current_url:
                    logger.info("Successfully logged in using cookies")
                    self.logged_in = True
                    return True
            
            # If cookies don't work, proceed with regular login
            logger.info("Logging in to LinkedIn...")
            self.driver.get('https://www.linkedin.com/login')
            self._random_pause(2.0, 4.0)
            
            # Enter username
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            for char in self.credentials.username:
                username_field.send_keys(char)
                time.sleep(random.uniform(0.05, 0.15))
            
            self._random_pause(0.5, 1.5)
            
            # Enter password
            password_field = self.driver.find_element(By.ID, "password")
            for char in self.credentials.password:
                password_field.send_keys(char)
                time.sleep(random.uniform(0.05, 0.15))
            
            self._random_pause(0.5, 1.5)
            
            # Click login button
            login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_button.click()
            
            # Wait for login to complete
            self._random_pause(3.0, 5.0)
            
            # Check for success (feed page) or failure (still on login page)
            if "feed" in self.driver.current_url:
                logger.info("Successfully logged in to LinkedIn")
                self.logged_in = True
                
                # Save cookies for future use
                self._save_cookies()
                
                return True
            else:
                # Check for security verification
                if "checkpoint" in self.driver.current_url or "security-verification" in self.driver.current_url:
                    logger.warning("LinkedIn security verification required. Please complete it manually.")
                    
                    # Allow time for manual intervention
                    time.sleep(30)
                    
                    if "feed" in self.driver.current_url:
                        logger.info("Successfully logged in after verification")
                        self.logged_in = True
                        
                        # Save cookies after successful verification
                        self._save_cookies()
                        
                        return True
                
                logger.error("Failed to login to LinkedIn")
                return False
                
        except Exception as e:
            logger.error(f"Error during LinkedIn login: {str(e)}")
            return False
    
    def scrape_company(self, company_url: str) -> Optional[CompanyData]:
        """
        Scrape a LinkedIn company page.
        
        Args:
            company_url: LinkedIn company URL
            
        Returns:
            CompanyData object with extracted information or None if failed
        """
        logger.info(f"Starting to scrape company: {company_url}")
        
        if not self.logged_in and not self.login():
            logger.error("Cannot scrape company: Not logged in")
            return None
            
        try:
            # Navigate to the company page
            self.driver.get(company_url)
            self._random_pause(2.0, 4.0)
            
            # Extract company name
            try:
                company_name = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".org-top-card-summary__title"))
                ).text.strip()
            except:
                company_name = self.driver.title.split('|')[0].strip()
            
            # Create the company data object
            company_data = CompanyData(
                name=company_name,
                url=company_url
            )
            
            # Scroll to load more content
            self._human_like_scroll(scroll_count=5)
            
            # Extract basic company info
            try:
                # Industry
                industry_elem = self.driver.find_element(By.CSS_SELECTOR, ".org-top-card-summary-info-list__info-item")
                if industry_elem:
                    company_data.industry = industry_elem.text.strip()
            except NoSuchElementException:
                pass
                
            try:
                # Website
                website_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test-id='about-us__website']")
                if website_elem:
                    website_link = website_elem.find_element(By.TAG_NAME, "a")
                    company_data.website = website_link.get_attribute("href")
            except NoSuchElementException:
                pass
                
            try:
                # Company size
                size_elem = self.driver.find_element(By.CSS_SELECTOR, "[data-test-id='about-us__size']")
                if size_elem:
                    company_data.company_size = size_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract description from About section
            try:
                # Click on About tab if necessary
                about_tabs = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='about']")
                for tab in about_tabs:
                    if "About" in tab.text:
                        tab.click()
                        self._random_pause(1.5, 3.0)
                        break
                        
                description_elem = self.driver.find_element(By.CSS_SELECTOR, ".org-about-us-organization-description__text")
                if description_elem:
                    company_data.description = description_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract recent updates (posts)
            try:
                # Click on Posts tab if necessary
                posts_tabs = self.driver.find_elements(By.CSS_SELECTOR, "a[href*='posts']")
                for tab in posts_tabs:
                    if "Posts" in tab.text:
                        tab.click()
                        self._random_pause(1.5, 3.0)
                        break
                
                post_elements = self.driver.find_elements(By.CSS_SELECTOR, ".org-update-card")
                recent_updates = []
                
                for post in post_elements[:5]:  # Get the 5 most recent posts
                    try:
                        post_text = post.find_element(By.CSS_SELECTOR, ".org-update-card__text").text.strip()
                        post_date = post.find_element(By.CSS_SELECTOR, ".org-update-card__date").text.strip()
                        
                        post_data = {
                            "date": post_date,
                            "content": post_text
                        }
                        
                        # Try to get engagement metrics
                        try:
                            engagement = post.find_element(By.CSS_SELECTOR, ".org-update-card__engagement").text.strip()
                            post_data["engagement"] = engagement
                        except:
                            pass
                            
                        recent_updates.append(post_data)
                    except:
                        continue
                        
                company_data.recent_updates = recent_updates
            except:
                pass
            
            logger.info(f"Successfully scraped company: {company_name}")
            return company_data
            
        except Exception as e:
            logger.error(f"Error scraping company {company_url}: {str(e)}")
            return None
    
    def scrape_profile(self, profile_url: str) -> Optional[ProfileData]:
        """
        Scrape a LinkedIn individual profile.
        
        Args:
            profile_url: LinkedIn profile URL
            
        Returns:
            ProfileData object with extracted information or None if failed
        """
        logger.info(f"Starting to scrape profile: {profile_url}")
        
        if not self.logged_in and not self.login():
            logger.error("Cannot scrape profile: Not logged in")
            return None
            
        try:
            # Navigate to the profile page
            self.driver.get(profile_url)
            self._random_pause(2.0, 4.0)
            
            # Extract profile name
            try:
                profile_name = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".pv-text-details__title"))
                ).text.strip()
            except:
                profile_name = self.driver.title.split('|')[0].strip()
            
            # Create the profile data object
            profile_data = ProfileData(
                name=profile_name,
                url=profile_url
            )
            
            # Scroll to load more content
            self._human_like_scroll(scroll_count=7)
            
            # Extract basic profile info
            try:
                # Title/headline
                title_elem = self.driver.find_element(By.CSS_SELECTOR, ".pv-text-details__subtitle")
                if title_elem:
                    profile_data.title = title_elem.text.strip()
                    
                    # Parse company from title if available
                    title_parts = profile_data.title.split(' at ')
                    if len(title_parts) > 1:
                        profile_data.company = title_parts[1].strip()
            except NoSuchElementException:
                pass
                
            try:
                # Location
                location_elem = self.driver.find_element(By.CSS_SELECTOR, ".pv-text-details__location")
                if location_elem:
                    profile_data.location = location_elem.text.strip()
            except NoSuchElementException:
                pass
            
            # Extract about section
            try:
                about_section = self.driver.find_element(By.CSS_SELECTOR, "section.pv-about-section")
                about_text = about_section.find_element(By.TAG_NAME, "p").text.strip()
                profile_data.about = about_text
            except NoSuchElementException:
                pass
            
            # Extract experience
            try:
                experience_section = self.driver.find_element(By.ID, "experience")
                experience_items = experience_section.find_elements(By.CSS_SELECTOR, ".pvs-list__item--line-separated")
                
                experience = []
                for item in experience_items[:3]:  # Get the 3 most recent positions
                    try:
                        role = item.find_element(By.CSS_SELECTOR, ".t-bold span").text.strip()
                        company = item.find_element(By.CSS_SELECTOR, ".t-14.t-normal span").text.strip()
                        dates = item.find_elements(By.CSS_SELECTOR, ".t-14.t-normal.t-black--light span")
                        date_range = dates[0].text.strip() if dates else ""
                        
                        experience.append({
                            "role": role,
                            "company": company,
                            "date_range": date_range
                        })
                    except:
                        continue
                        
                profile_data.experience = experience
            except NoSuchElementException:
                pass
            
            # Extract accomplishments
            try:
                # Scroll down to accomplishments section
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                self._random_pause(1.0, 2.0)
                
                accomplishments_section = self.driver.find_element(By.CSS_SELECTOR, "section.pv-accomplishments-section")
                accomplishment_categories = accomplishments_section.find_elements(By.CSS_SELECTOR, ".pv-accomplishments-block")
                
                accomplishments = []
                for category in accomplishment_categories:
                    try:
                        category_name = category.find_element(By.CSS_SELECTOR, ".pv-accomplishments-block__title").text.strip()
                        items = category.find_elements(By.CSS_SELECTOR, ".pv-accomplishments-block__list-item")
                        
                        item_texts = [item.text.strip() for item in items]
                        
                        accomplishments.append({
                            "category": category_name,
                            "items": item_texts
                        })
                    except:
                        continue
                        
                profile_data.accomplishments = accomplishments
            except NoSuchElementException:
                pass
            
            # Extract recent activity
            try:
                # Navigate to activity tab
                activity_url = f"{profile_url}/recent-activity/"
                self.driver.get(activity_url)
                self._random_pause(2.0, 4.0)
                
                # Scroll to load more content
                self._human_like_scroll(scroll_count=3)
                
                activity_items = self.driver.find_elements(By.CSS_SELECTOR, ".pv-recent-activity-detail__feed-item")
                recent_activity = []
                
                for item in activity_items[:5]:  # Get the 5 most recent activities
                    try:
                        content = item.find_element(By.CSS_SELECTOR, ".feed-shared-update-v2__description").text.strip()
                        timestamp = item.find_element(By.CSS_SELECTOR, ".feed-shared-actor__sub-description").text.strip()
                        
                        activity = ProfileActivity(
                            date=timestamp,
                            content=content
                        )
                        
                        # Try to get engagement metrics
                        try:
                            likes_elem = item.find_element(By.CSS_SELECTOR, "[data-test-id='social-actions-counts']")
                            if likes_elem:
                                likes_text = likes_elem.text.strip()
                                if 'Like' in likes_text:
                                    likes_match = re.search(r'(\d+)', likes_text)
                                    if likes_match:
                                        activity.likes = int(likes_match.group(1))
                        except:
                            pass
                            
                        recent_activity.append(activity)
                    except:
                        continue
                        
                profile_data.recent_activity = recent_activity
            except Exception as e:
                logger.warning(f"Error getting recent activity: {str(e)}")
            
            # Extract skills
            try:
                # Navigate to skills tab
                skills_url = f"{profile_url}/details/skills/"
                self.driver.get(skills_url)
                self._random_pause(2.0, 4.0)
                
                skill_elements = self.driver.find_elements(By.CSS_SELECTOR, ".pv-skill-category-entity__name")
                skills = [skill.text.strip() for skill in skill_elements]
                
                profile_data.skills = skills
            except:
                pass
            
            # Extract contact info
            try:
                # Navigate to contact info
                contact_url = f"{profile_url}/overlay/contact-info/"
                self.driver.get(contact_url)
                self._random_pause(2.0, 4.0)
                
                contact_section = self.driver.find_element(By.CSS_SELECTOR, ".artdeco-modal__content")
                contact_items = contact_section.find_elements(By.CSS_SELECTOR, ".pv-contact-info__ci-container")
                
                contact_info = {}
                for item in contact_items:
                    try:
                        label = item.find_element(By.CSS_SELECTOR, ".pv-contact-info__header").text.strip()
                        value_elem = item.find_element(By.CSS_SELECTOR, ".pv-contact-info__ci-container .pv-contact-info__contact-link") 
                        value = value_elem.text.strip() or value_elem.get_attribute("href")
                        
                        contact_info[label.lower()] = value
                    except:
                        continue
                        
                profile_data.contact_info = contact_info
            except:
                pass
            
            logger.info(f"Successfully scraped profile: {profile_name}")
            return profile_data
            
        except Exception as e:
            logger.error(f"Error scraping profile {profile_url}: {str(e)}")
            return None
    
    def close(self) -> None:
        """Close the WebDriver and release resources"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.logged_in = False
            logger.info("LinkedIn scraper closed")

# Example usage
if __name__ == "__main__":
    credentials = LinkedInCredentials(
        username="your_linkedin_email",
        password="your_linkedin_password"
    )
    
    scraper = LinkedInScraper(credentials, headless=False)
    
    try:
        # Scrape company example
        company_data = scraper.scrape_company("https://www.linkedin.com/company/microsoft")
        if company_data:
            print(f"Company data: {json.dumps(asdict(company_data), indent=2)}")
            
        # Scrape profile example
        profile_data = scraper.scrape_profile("https://www.linkedin.com/in/satyanadella")
        if profile_data:
            print(f"Profile data: {json.dumps(asdict(profile_data), indent=2)}")
    
    finally:
        scraper.close()