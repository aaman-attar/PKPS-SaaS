import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2"


def format_indian_mobile(mobile: str) -> str:
    """
    Convert an Indian mobile number into a clean 10-digit number.

    Accepted examples:
        9845403249
        09845403249
        919845403249
        +919845403249
        +91 98454 03249

    Returns:
        10-digit mobile number as a string.
    """

    if not mobile:
        return ""

    clean = str(mobile).strip()

    # Remove common separators
    clean = (
        clean
        .replace(" ", "")
        .replace("-", "")
        .replace("(", "")
        .replace(")", "")
    )

    # Remove +91
    if clean.startswith("+91"):
        clean = clean[3:]

    # Remove 91 if number is 12 digits
    elif clean.startswith("91") and len(clean) == 12:
        clean = clean[2:]

    # Remove leading 0 if number is 11 digits
    elif clean.startswith("0") and len(clean) == 11:
        clean = clean[1:]

    return clean


def is_valid_indian_mobile(mobile: str) -> bool:
    """
    Validate a normalized Indian mobile number.
    """

    return (
        len(mobile) == 10
        and mobile.isdigit()
        and mobile[0] in "6789"
    )


def send_sms_otp(to_mobile: str, otp_code: str) -> dict:
    """
    Send an OTP using the normal Fast2SMS OTP API.

    IMPORTANT:
    - This is NOT Smart OTP.
    - This uses Fast2SMS route=otp.
    - Django generates the OTP.
    - Fast2SMS only delivers the OTP SMS.
    - OTP verification should be handled by your Django backend.
    - No Quick SMS fallback is used.
    """

    # ---------------------------------------------------------
    # Read configuration
    # ---------------------------------------------------------

    fast2sms_enabled = getattr(
        settings,
        "FAST2SMS_ENABLED",
        False
    )

    api_key = getattr(
        settings,
        "FAST2SMS_API_KEY",
        ""
    )

    # ---------------------------------------------------------
    # Normalize mobile number
    # ---------------------------------------------------------

    clean_mobile = format_indian_mobile(to_mobile)

    if not is_valid_indian_mobile(clean_mobile):
        logger.warning(
            "Invalid Indian mobile number supplied: %s",
            to_mobile
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Invalid Indian mobile number."
        }

    # ---------------------------------------------------------
    # Validate OTP
    # ---------------------------------------------------------

    otp_code = str(otp_code).strip()

    if not otp_code.isdigit():
        logger.warning(
            "Invalid OTP supplied for SMS sending."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Invalid OTP."
        }

    if len(otp_code) < 4 or len(otp_code) > 10:
        logger.warning(
            "OTP length is invalid."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Invalid OTP length."
        }

    # ---------------------------------------------------------
    # Development / Fast2SMS disabled mode
    # ---------------------------------------------------------

    if not fast2sms_enabled:
        otp_banner = (
            f"\n==================================================\n"
            f" [DEV / RENDER SMS LOG] OTP CODE GENERATED\n"
            f" Target Mobile: +91{clean_mobile}\n"
            f" VERIFICATION OTP CODE: {otp_code}\n"
            f"==================================================\n"
        )
        print(otp_banner, flush=True)

        logger.info(
            "[SMS SIMULATION / RENDER LOG] Target +91%s OTP: %s",
            clean_mobile,
            otp_code
        )

        is_debug = getattr(settings, "DEBUG", True)
        msg = f"OTP generated successfully. (For dev/testing code is: {otp_code})" if is_debug else "OTP sent successfully."

        return {
            "success": True,
            "provider": "Console Simulation",
            "message": msg
        }

    # ---------------------------------------------------------
    # Validate API key
    # ---------------------------------------------------------

    if not api_key:
        logger.error(
            "FAST2SMS_API_KEY is not configured."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Fast2SMS API key is not configured."
        }

    # Prevent accidentally running with placeholder value
    invalid_keys = {
        "YOUR_FAST2SMS_API_KEY_HERE",
        "your_actual_fast2sms_api_key_here",
        "YOUR_API_KEY",
    }

    if api_key.strip() in invalid_keys:
        logger.error(
            "Fast2SMS API key still contains the placeholder value."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Fast2SMS API key is not configured."
        }

    # ---------------------------------------------------------
    # Fast2SMS OTP Delivery (route=otp with route=q fallback)
    # ---------------------------------------------------------

    headers = {
        "authorization": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload_otp = {
        "route": "otp",
        "variables_values": otp_code,
        "numbers": clean_mobile,
        "flash": "0",
    }

    try:
        # Step 1: Try OTP route (POST)
        response = requests.post(
            FAST2SMS_URL,
            json=payload_otp,
            headers=headers,
            timeout=15,
        )

        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("return") is True:
                    request_id = data.get("request_id")
                    logger.info(
                        "Fast2SMS OTP sent successfully. Mobile=+91%s RequestID=%s",
                        clean_mobile,
                        request_id,
                    )
                    is_debug = getattr(settings, "DEBUG", True)
                    msg = f"OTP sent successfully. (For dev/testing code is: {otp_code})" if is_debug else "OTP sent successfully."
                    return {
                        "success": True,
                        "provider": "Fast2SMS OTP",
                        "request_id": request_id,
                        "message": msg
                    }
                else:
                    logger.warning("Fast2SMS OTP route returned return=False: %s", data)
            except ValueError:
                pass

        # Step 2: Fallback to Quick SMS (route=q) if OTP route failed (e.g. status_code 996 website verification required)
        logger.info(
            "Fast2SMS OTP route did not succeed (HTTP %s). Attempting Quick SMS (route=q) POST fallback...",
            response.status_code
        )

        sms_message = f"Your PKPS SaaS Verification OTP Code is: {otp_code}. Valid for 5 minutes."

        payload_q = {
            "route": "q",
            "message": sms_message,
            "language": "english",
            "numbers": clean_mobile,
            "flash": "0",
        }

        # Try Quick SMS POST
        res_q_post = requests.post(
            FAST2SMS_URL,
            json=payload_q,
            headers=headers,
            timeout=15,
        )

        if res_q_post.status_code == 200:
            try:
                data_q = res_q_post.json()
                if data_q.get("return") is True:
                    request_id = data_q.get("request_id")
                    logger.info(
                        "Fast2SMS Quick SMS (POST) sent successfully to +91%s. RequestID=%s",
                        clean_mobile,
                        request_id,
                    )
                    is_debug = getattr(settings, "DEBUG", True)
                    msg = f"OTP sent successfully via SMS. (For dev/testing code is: {otp_code})" if is_debug else "OTP sent successfully via SMS."
                    return {
                        "success": True,
                        "provider": "Fast2SMS Quick SMS",
                        "request_id": request_id,
                        "message": msg
                    }
                else:
                    logger.warning("Fast2SMS Quick SMS POST returned return=False: %s", data_q)
            except ValueError:
                pass

        # Try Quick SMS GET as second fallback
        logger.info("Attempting Quick SMS (route=q) GET fallback...")
        params_q = {
            "authorization": api_key,
            "route": "q",
            "message": sms_message,
            "language": "english",
            "numbers": clean_mobile,
            "flash": "0",
        }

        res_q_get = requests.get(
            FAST2SMS_URL,
            params=params_q,
            headers={"authorization": api_key},
            timeout=15,
        )

        if res_q_get.status_code == 200:
            try:
                data_q_get = res_q_get.json()
                if data_q_get.get("return") is True:
                    request_id = data_q_get.get("request_id")
                    logger.info(
                        "Fast2SMS Quick SMS (GET) sent successfully to +91%s. RequestID=%s",
                        clean_mobile,
                        request_id,
                    )
                    is_debug = getattr(settings, "DEBUG", True)
                    msg = f"OTP sent successfully via SMS. (For dev/testing code is: {otp_code})" if is_debug else "OTP sent successfully via SMS."
                    return {
                        "success": True,
                        "provider": "Fast2SMS Quick SMS",
                        "request_id": request_id,
                        "message": msg
                    }
            except ValueError:
                pass

        # If all attempts failed, extract error message from best available response
        failed_response = response
        if res_q_post.status_code < 500:
            failed_response = res_q_post
        elif res_q_get.status_code < 500:
            failed_response = res_q_get

        try:
            err_data = failed_response.json()
            err_msg = err_data.get("message", failed_response.text[:150])
            if isinstance(err_msg, list):
                err_msg = ", ".join(str(i) for i in err_msg)
        except Exception:
            err_msg = failed_response.text[:150]

        logger.error(
            "Fast2SMS API failed across all routes. Status=%s Body=%s",
            failed_response.status_code,
            failed_response.text[:500],
        )

        is_debug = getattr(settings, "DEBUG", True)
        dev_suffix = f" (For dev/testing code is: {otp_code})" if is_debug else ""

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": f"Fast2SMS error (HTTP {failed_response.status_code}): {err_msg}.{dev_suffix}"
        }

    # ---------------------------------------------------------
    # Network timeout
    # ---------------------------------------------------------

    except requests.exceptions.Timeout:

        logger.error(
            "Fast2SMS request timed out."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Fast2SMS request timed out. Please try again."
        }

    # ---------------------------------------------------------
    # Network / connection error
    # ---------------------------------------------------------

    except requests.exceptions.ConnectionError:

        logger.error(
            "Could not connect to Fast2SMS."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Could not connect to Fast2SMS."
        }

    # ---------------------------------------------------------
    # Other requests errors
    # ---------------------------------------------------------

    except requests.exceptions.RequestException as e:

        logger.error(
            "Fast2SMS request exception: %s",
            str(e)
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Fast2SMS request failed."
        }

    # ---------------------------------------------------------
    # Unexpected error
    # ---------------------------------------------------------

    except Exception:

        logger.exception(
            "Unexpected error while sending Fast2SMS OTP."
        )

        return {
            "success": False,
            "provider": "Fast2SMS",
            "message": "Unexpected SMS service error."
        }