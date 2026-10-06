import os
import requests
from abc import ABC, abstractmethod
from django.conf import settings

class BaseSMSProvider(ABC):
    @abstractmethod
    def send_sms(self, mobile_number: str, message: str) -> bool:
        pass

class Fast2SMSProvider(BaseSMSProvider):
    def send_sms(self, mobile_number: str, message: str) -> bool:
        from .sms_service import send_sms_otp
        digits = ''.join(c for c in message if c.isdigit())
        otp_to_send = digits if (digits and len(digits) == 6) else message
        res = send_sms_otp(mobile_number, otp_to_send)
        return res.get('success', False)

class TwilioProvider(BaseSMSProvider):
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_FROM_NUMBER')

    def send_sms(self, mobile_number: str, message: str) -> bool:
        if not (self.account_sid and self.auth_token and self.from_number):
            print("[SMS PROVIDER] Twilio credentials incomplete.")
            return False

        try:
            from twilio.rest import Client
            client = Client(self.account_sid, self.auth_token)
            clean_mobile = mobile_number if mobile_number.startswith('+') else f"+91{mobile_number}"
            msg = client.messages.create(body=message, from_=self.from_number, to=clean_mobile)
            print(f"[SMS PROVIDER - Twilio] Message SID {msg.sid} sent to {clean_mobile}")
            return True
        except Exception as e:
            print(f"[SMS PROVIDER - Twilio EXCEPTION] {e}")
            return False

class ConsoleSMSProvider(BaseSMSProvider):
    def send_sms(self, mobile_number: str, message: str) -> bool:
        print(f"\n================ [CONSOLE SMS PROVIDER] ================")
        print(f"TO: {mobile_number}")
        print(f"MESSAGE: {message}")
        print(f"========================================================\n")
        return True

def get_sms_provider() -> BaseSMSProvider:
    provider_type = os.getenv('SMS_PROVIDER', 'fast2sms').lower()
    enabled = getattr(settings, 'FAST2SMS_ENABLED', False)

    if provider_type == 'twilio' and os.getenv('TWILIO_ACCOUNT_SID'):
        return TwilioProvider()
    elif provider_type == 'fast2sms' and enabled:
        return Fast2SMSProvider()
    else:
        return ConsoleSMSProvider()
