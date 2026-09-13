import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def format_mobile_number(to_mobile: str) -> str:
    clean_mobile = to_mobile.strip().replace(' ', '').replace('-', '')
    if not clean_mobile.startswith('+'):
        if len(clean_mobile) == 10:
            clean_mobile = f"+91{clean_mobile}"
        else:
            clean_mobile = f"+{clean_mobile}"
    return clean_mobile

def send_sms_otp(to_mobile: str, otp_code: str):
    """
    Dispatches 6-digit OTP via Twilio SMS / Verify API.
    If Twilio Trial restricts international SMS to India (+91), catches the exception
    and returns a fallback message so login testing never gets blocked.
    """
    twilio_enabled = getattr(settings, 'TWILIO_ENABLED', False)
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    verify_service_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')

    clean_mobile = format_mobile_number(to_mobile)
    message_body = f"Your OTP is: {otp_code}"

    if twilio_enabled and account_sid and auth_token:
        try:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)

            if verify_service_sid:
                verification = client.verify.v2.services(verify_service_sid).verifications.create(
                    to=clean_mobile,
                    channel='sms'
                )
                logger.info(f"Twilio Verify SMS sent to {clean_mobile}. SID: {verification.sid}")
                return {
                    'success': True,
                    'provider': 'Twilio Verify API',
                    'sid': verification.sid,
                    'message': f'OTP sent successfully via SMS to {clean_mobile}.'
                }
            elif from_number:
                message = client.messages.create(
                    body=message_body,
                    from_=from_number,
                    to=clean_mobile
                )
                logger.info(f"Twilio SMS sent to {clean_mobile}. SID: {message.sid}")
                return {
                    'success': True,
                    'provider': 'Twilio SMS API',
                    'sid': message.sid,
                    'message': f'OTP sent successfully via SMS to {clean_mobile}.'
                }
        except Exception as e:
            logger.warning(f"Twilio SMS delivery failed for {clean_mobile}: {e}")
            return {
                'success': False,
                'provider': 'Twilio (Trial Restriction)',
                'error': str(e),
                'message': f'Twilio Trial SMS restricted for {clean_mobile}. (Dev Testing Code: {otp_code})'
            }
    
    logger.info(f"[DEV SIMULATION] OTP for {clean_mobile}: {otp_code}")
    return {
        'success': True,
        'provider': 'Console Simulation',
        'message': f'OTP generated successfully. (Dev Testing Code: {otp_code})'
    }

def check_twilio_verify_otp(to_mobile: str, otp_code: str):
    """
    Verifies an OTP code via Twilio Verify API if configured.
    """
    twilio_enabled = getattr(settings, 'TWILIO_ENABLED', False)
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    verify_service_sid = getattr(settings, 'TWILIO_VERIFY_SERVICE_SID', '')

    if twilio_enabled and account_sid and auth_token and verify_service_sid:
        try:
            from twilio.rest import Client
            clean_mobile = format_mobile_number(to_mobile)
            client = Client(account_sid, auth_token)
            check = client.verify.v2.services(verify_service_sid).verification_checks.create(
                to=clean_mobile,
                code=otp_code
            )
            return check.status == 'approved'
        except Exception as e:
            logger.error(f"Twilio Verify Check error for {to_mobile}: {e}")
            return False
    return False
