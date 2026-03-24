import time
import datetime
from google.oauth2 import service_account
import google.auth.transport.requests
import google.auth._helpers

def test_offset(days_offset):
    print(f"Testing offset of {days_offset} days...")
    
    # Save original references
    orig_time = time.time
    orig_utcnow = google.auth._helpers.utcnow

    try:
        # Patch them
        def mocked_time(): return orig_time() - (days_offset * 24 * 3600.0)
        time.time = mocked_time
        
        def mocked_utcnow(): return orig_utcnow() - datetime.timedelta(days=days_offset)
        google.auth._helpers.utcnow = mocked_utcnow

        cred = service_account.Credentials.from_service_account_file(
            '../serviceAccountKey.json', 
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        request = google.auth.transport.requests.Request()
        cred.refresh(request)
        print(f"Success with {days_offset} days offset!")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False
    finally:
        # Restore original references
        time.time = orig_time
        google.auth._helpers.utcnow = orig_utcnow

if __name__ == "__main__":
    # Test current time
    test_offset(0)
    
    # Test past time (roughly back to 2024 if we are in 2026)
    test_offset(365)
    test_offset(365*2)
    test_offset(365*2 + 30)
    test_offset(500)
    test_offset(700)
    test_offset(730)
    test_offset(800)
