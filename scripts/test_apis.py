#!/usr/bin/env python3

"""
API Testing Script for Outreach Mate

This script tests the integration with external APIs (OpenAI, Apollo.io, Gemini)
to ensure they are working correctly.
"""

import os
import sys
import asyncio
import requests
import json
from typing import Dict, Any

# Add the parent directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.config import settings

class APITester:
    def __init__(self):
        self.results = {}
    
    async def test_openai_api(self) -> Dict[str, Any]:
        """Test OpenAI API connection"""
        try:
            import openai
            
            if not settings.OPENAI_API_KEY:
                return {"status": "error", "message": "OpenAI API key not configured"}
            
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            # Test with a simple completion
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello! This is a test."}],
                max_tokens=50
            )
            
            return {
                "status": "success",
                "message": "OpenAI API connection successful",
                "response": response.choices[0].message.content
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"OpenAI API error: {str(e)}"
            }
    
    async def test_apollo_api(self) -> Dict[str, Any]:
        """Test Apollo.io API connection"""
        try:
            if not settings.APOLLO_API_KEY:
                return {"status": "error", "message": "Apollo.io API key not configured"}
            
            headers = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'X-Api-Key': settings.APOLLO_API_KEY
            }
            
            # Test with a simple organization search
            payload = {
                'domain': 'apollo.io',
                'name': 'Apollo'
            }
            
            response = requests.post(
                'https://api.apollo.io/v1/organizations/enrich',
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "message": "Apollo.io API connection successful",
                    "response": data.get('organization', {}).get('name', 'Unknown')
                }
            else:
                return {
                    "status": "error",
                    "message": f"Apollo.io API error: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Apollo.io API error: {str(e)}"
            }
    
    async def test_gemini_api(self) -> Dict[str, Any]:
        """Test Gemini API connection"""
        try:
            if not settings.GEMINI_API_KEY:
                return {"status": "error", "message": "Gemini API key not configured"}
            
            import google.generativeai as genai
            
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
            
            # Test with a simple generation
            response = model.generate_content("Hello! This is a test.")
            
            return {
                "status": "success",
                "message": "Gemini API connection successful",
                "response": response.text[:100] + "..." if len(response.text) > 100 else response.text
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Gemini API error: {str(e)}"
            }
    
    async def test_backend_api(self) -> Dict[str, Any]:
        """Test backend API connection"""
        try:
            response = requests.get('http://localhost:8000/health', timeout=5)
            
            if response.status_code == 200:
                return {
                    "status": "success",
                    "message": "Backend API connection successful",
                    "response": response.json()
                }
            else:
                return {
                    "status": "error",
                    "message": f"Backend API error: {response.status_code}"
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Backend API error: {str(e)}"
            }
    
    async def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Testing Outreach Mate APIs...")
        print("=" * 50)
        
        # Test backend API
        print("📡 Testing Backend API...")
        self.results['backend'] = await self.test_backend_api()
        self._print_result('Backend API', self.results['backend'])
        
        # Test OpenAI API
        print("\n🤖 Testing OpenAI API...")
        self.results['openai'] = await self.test_openai_api()
        self._print_result('OpenAI API', self.results['openai'])
        
        # Test Apollo.io API
        print("\n🚀 Testing Apollo.io API...")
        self.results['apollo'] = await self.test_apollo_api()
        self._print_result('Apollo.io API', self.results['apollo'])
        
        # Test Gemini API
        print("\n💎 Testing Gemini API...")
        self.results['gemini'] = await self.test_gemini_api()
        self._print_result('Gemini API', self.results['gemini'])
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        success_count = sum(1 for result in self.results.values() if result['status'] == 'success')
        total_count = len(self.results)
        
        print(f"✅ Passed: {success_count}/{total_count}")
        print(f"❌ Failed: {total_count - success_count}/{total_count}")
        
        if success_count == total_count:
            print("\n🎉 All tests passed! Your Outreach Mate setup is ready.")
        else:
            print("\n⚠️  Some tests failed. Please check your API keys and configuration.")
            
        return success_count == total_count
    
    def _print_result(self, name: str, result: Dict[str, Any]):
        """Print test result"""
        status = "✅" if result['status'] == 'success' else "❌"
        print(f"{status} {name}: {result['message']}")
        
        if result['status'] == 'success' and 'response' in result:
            print(f"   Response: {result['response']}")

async def main():
    """Main function"""
    tester = APITester()
    success = await tester.run_all_tests()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())