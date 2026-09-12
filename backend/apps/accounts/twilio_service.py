import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_sms_otp(to_mobile: str, otp_code: str):
    """
    Sends a 6-digit OTP to the recipient mobile number via Twilio SMS REST API.
    Falls back gracefully if Twilio is disabled or credentials are missing.
    """
    twilio_enabled = getattr(settings, 'TWILIO_ENABLED', False)
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')

    # Format mobile number (ensure +91 country code prefix for India if 10 digits)
    clean_mobile = to_mobile.strip().replace(' ', '').replace('-', '')
    if not clean_mobile.startswith('+'):
        if len(clean_mobile) == 10:
            clean_mobile = f"+91{clean_mobile}"
        else:
            clean_mobile = f"+{clean_mobile}"

    message_body = f"Your OTP is: {otp_code}"

    if twilio_enabled and account_sid and auth_token and from_number:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            message = client.messages.create(
                body=message_body,
                from_=from_number,
                to=clean_mobile
            )
            logger.info(f"Twilio SMS sent successfully to {clean_mobile}. SID: {message.sid}")
            return {
                'success': True,
                'provider': 'Twilio SMS',
                'sid': message.sid,
                'message': f'OTP sent successfully via SMS to {clean_mobile}.'
            }
        except Exception as e:
            logger.error(f"Failed to send Twilio SMS to {clean_mobile}: {e}")
            return {
                'success': False,
                'provider': 'Twilio SMS (Error)',
                'error': str(e),
                'message': f'SMS dispatch error: {e}'
            }
    else:
        logger.info(f"[DEV SIMULATION] OTP for {clean_mobile}: {otp_code}")
        return {
            'success': True,
            'provider': 'Console Simulation',
            'message': f'OTP sent successfully to {clean_mobile}.'
        }
