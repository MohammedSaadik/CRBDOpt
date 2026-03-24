import urllib.request
from email.utils import parsedate_to_datetime
import datetime
import urllib.error
from google.oauth2 import service_account
import google.auth.transport.requests
import google.auth._helpers
import sys

def main():
    # 1. Fetch exact Google time
    req = urllib.request.Request("http://google.com", method="HEAD")
    try:
        with urllib.request.urlopen(req) as response:
            date_str = response.headers.get('Date')
    except urllib.error.HTTPError as e:
        date_str = e.headers.get('Date')
    except Exception as e:
        print("Failed to get google time:", e)
        return

    google_time = parsedate_to_datetime(date_str)
    if google_time.tzinfo is not None:
        google_time = google_time.replace(tzinfo=None) - google_time.utcoffset()

    sys_time = datetime.datetime.utcnow()
    offset = sys_time - google_time
    
    print(f"Google Time: {google_time}")
    print(f"System Time: {sys_time}")
    print(f"Offset (System - Google): {offset}")

    # 2. Patch auth clock to match Google exact time
    orig_utcnow = google.auth._helpers.utcnow
    def synced_utcnow():
        return orig_utcnow() - offset
    google.auth._helpers.utcnow = synced_utcnow

    # 3. Test token logic
    try:
        cred = service_account.Credentials.from_service_account_file(
            '../serviceAccountKey.json', 
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        request = google.auth.transport.requests.Request()
        cred.refresh(request)
        print("SUCCESS! Token acquired successfully with synced time.")
    except Exception as e:
        print("ERROR:", e)
        
    google.auth._helpers.utcnow = orig_utcnow

if __name__ == "__main__":
    with open('time_sync_log.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        main()
