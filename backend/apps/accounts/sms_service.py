import os
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def format_indian_mobile(mobile: str) -> str:
    """Extracts clean 10-digit Indian mobile number."""
    clean = mobile.strip().replace(' ', '').replace('-', '')
    if clean.startswith('+91'):
        clean = clean[3:]
    elif clean.startswith('91') and len(clean) == 12:
        clean = clean[2:]
    elif clean.startswith('0') and len(clean) == 11:
        clean = clean[1:]
    return clean

def send_sms_otp(to_mobile: str, otp_code: str):
    """
    Dispatches 6-digit OTP to Indian mobile number via Fast2SMS API.
    Provides instant 2-second SMS delivery across Jio, Airtel, Vi, BSNL in India.
    """
    fast2sms_enabled = getattr(settings, 'FAST2SMS_ENABLED', False)
    api_key = getattr(settings, 'FAST2SMS_API_KEY', '')
    
    clean_mobile = format_indian_mobile(to_mobile)

    if fast2sms_enabled and api_key:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            
            # 1. Fast2SMS OTP Route
            payload = {
                'variables_values': otp_code,
                'route': 'otp',
                'numbers': clean_mobile
            }
            headers = {
                'authorization': api_key,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache'
            }
            
            response = requests.post(url, data=payload, headers=headers, timeout=10)
            res_data = response.json()
            
            if res_data.get('return') is True:
                logger.info(f"Fast2SMS OTP sent successfully to +91{clean_mobile}. Response: {res_data}")
                return {
                    'success': True,
                    'provider': 'Fast2SMS (India)',
                    'message': f'OTP sent successfully via SMS to +91{clean_mobile}.'
                }
            else:
                # 2. Fallback to Quick SMS route if OTP route needs specific variable setup
                q_payload = {
                    'message': f'Your PKPS SaaS Verification OTP is: {otp_code}. Valid for 5 mins.',
                    'language': 'english',
                    'route': 'q',
                    'numbers': clean_mobile
                }
                q_response = requests.post(url, data=q_payload, headers=headers, timeout=10)
                q_data = q_response.json()
                if q_data.get('return') is True:
                    logger.info(f"Fast2SMS Quick SMS sent successfully to +91{clean_mobile}.")
                    return {
                        'success': True,
                        'provider': 'Fast2SMS Quick SMS',
                        'message': f'OTP sent successfully via SMS to +91{clean_mobile}.'
                    }
                else:
                    err_msg = q_data.get('message', ['SMS failed'])[0] if isinstance(q_data.get('message'), list) else q_data.get('message', 'SMS failed')
                    logger.warning(f"Fast2SMS API error: {q_data}")
                    return {
                        'success': False,
                        'provider': 'Fast2SMS (Error)',
                        'message': f'Fast2SMS error: {err_msg}. (Dev Code: {otp_code})'
                    }
        except Exception as e:
            logger.error(f"Fast2SMS dispatch exception: {e}")
            return {
                'success': False,
                'provider': 'Fast2SMS (Exception)',
                'message': f'SMS dispatch exception: {e}. (Dev Code: {otp_code})'
            }

    logger.info(f"[DEV SIMULATION] Fast2SMS OTP for +91{clean_mobile}: {otp_code}")
    return {
        'success': True,
        'provider': 'Console Simulation',
        'message': f'OTP generated successfully. (Dev Testing Code: {otp_code})'
    }
