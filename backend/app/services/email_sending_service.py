from typing import Dict, List, Optional
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import base64
import json
import msal

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailSendingService:
    def __init__(self):
        self.gmail_service = GmailService()
        self.outlook_service = OutlookService()
    
    async def send_prospect_email(self, prospect_data: Dict, email_type: str, 
                                 contact_id: str, sender_type: str, user_id: str) -> Dict:
        """
        Send email to prospect using selected provider
        """
        try:
            # Get email content
            if email_type == "company":
                email_data = prospect_data.get('aiEmailDraft')
                recipient_email = prospect_data.get('company', {}).get('contact_form_url')  # This would be updated
            else:
                email_data = prospect_data.get('contacts_email_drafts', {}).get(contact_id)
                contact = next((c for c in prospect_data.get('contacts', []) if c.get('contact_id') == contact_id), None)
                recipient_email = contact.get('email_primary') if contact else None
            
            if not email_data or not recipient_email:
                return {"error": "Email data or recipient not found"}
            
            # Prepare email for sending
            email_to_send = {
                'to': recipient_email,
                'subject': email_data.get('subject', ''),
                'body': email_data.get('body', ''),
                'from_name': 'Your Name',  # This would come from user settings
                'from_email': 'your-email@example.com'  # This would come from user settings
            }
            
            # Send via selected provider
            if sender_type == "gmail":
                result = await self.gmail_service.send_email(email_to_send, user_id)
            elif sender_type == "outlook":
                result = await self.outlook_service.send_email(email_to_send, user_id)
            else:
                return {"error": "Invalid sender type"}
            
            # Log email send
            await self._log_email_send(prospect_data, email_type, contact_id, result, user_id)
            
            return result
            
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            return {"error": f"Email sending failed: {str(e)}"}
    
    async def _log_email_send(self, prospect_data: Dict, email_type: str, 
                             contact_id: str, result: Dict, user_id: str):
        """Log email send to database"""
        try:
            # This would insert into email_logs table
            log_data = {
                'user_id': user_id,
                'prospect_id': prospect_data.get('id'),
                'contact_id': contact_id,
                'email_type': email_type,
                'send_status': 'sent' if result.get('success') else 'failed',
                'message_id': result.get('message_id'),
                'error': result.get('error'),
                'sent_at': 'NOW()',
                'tracking_data': json.dumps(result.get('tracking_data', {}))
            }
            
            logger.info(f"Email send logged: {log_data}")
            
        except Exception as e:
            logger.error(f"Failed to log email send: {str(e)}")

class GmailService:
    def __init__(self):
        self.scopes = ['https://www.googleapis.com/auth/gmail.send']
    
    async def send_email(self, email_data: Dict, user_id: str) -> Dict:
        """Send email via Gmail API"""
        try:
            # Get user's Gmail credentials
            credentials = await self._get_user_credentials(user_id)
            if not credentials:
                return {"error": "Gmail credentials not found"}
            
            # Build Gmail service
            service = build('gmail', 'v1', credentials=credentials)
            
            # Create message
            message = MIMEMultipart()
            message['to'] = email_data['to']
            message['subject'] = email_data['subject']
            message['from'] = f"{email_data['from_name']} <{email_data['from_email']}>"
            
            # Add body
            body = MIMEText(email_data['body'], 'plain')
            message.attach(body)
            
            # Encode message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Send message
            send_result = service.users().messages().send(
                userId='me',
                body={'raw': raw_message}
            ).execute()
            
            return {
                "success": True,
                "message_id": send_result.get('id'),
                "timestamp": send_result.get('timestamp')
            }
            
        except Exception as e:
            logger.error(f"Gmail send error: {str(e)}")
            return {"error": f"Gmail send failed: {str(e)}"}
    
    async def _get_user_credentials(self, user_id: str) -> Optional[Credentials]:
        """Get user's Gmail credentials from database"""
        try:
            # This would query the database for user's Gmail credentials
            # For now, returning None (mock implementation)
            return None
        except Exception as e:
            logger.error(f"Failed to get Gmail credentials: {str(e)}")
            return None

class OutlookService:
    def __init__(self):
        self.client_id = settings.MICROSOFT_CLIENT_ID
        self.client_secret = settings.MICROSOFT_CLIENT_SECRET
        self.authority = f"https://login.microsoftonline.com/{settings.MICROSOFT_TENANT_ID}"
        self.scope = ["https://graph.microsoft.com/Mail.Send"]
    
    async def send_email(self, email_data: Dict, user_id: str) -> Dict:
        """Send email via Microsoft Graph API"""
        try:
            # Get user's Outlook credentials
            access_token = await self._get_user_access_token(user_id)
            if not access_token:
                return {"error": "Outlook credentials not found"}
            
            # Prepare email message
            email_message = {
                "message": {
                    "subject": email_data['subject'],
                    "body": {
                        "contentType": "Text",
                        "content": email_data['body']
                    },
                    "toRecipients": [
                        {
                            "emailAddress": {
                                "address": email_data['to']
                            }
                        }
                    ]
                }
            }
            
            # Send via Microsoft Graph
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            import requests
            response = requests.post(
                'https://graph.microsoft.com/v1.0/me/sendMail',
                headers=headers,
                json=email_message
            )
            
            if response.status_code == 202:
                return {
                    "success": True,
                    "message_id": response.headers.get('x-ms-request-id'),
                    "timestamp": response.headers.get('date')
                }
            else:
                return {"error": f"Outlook send failed: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Outlook send error: {str(e)}")
            return {"error": f"Outlook send failed: {str(e)}"}
    
    async def _get_user_access_token(self, user_id: str) -> Optional[str]:
        """Get user's Outlook access token from database"""
        try:
            # This would query the database for user's Outlook credentials
            # For now, returning None (mock implementation)
            return None
        except Exception as e:
            logger.error(f"Failed to get Outlook access token: {str(e)}")
            return None