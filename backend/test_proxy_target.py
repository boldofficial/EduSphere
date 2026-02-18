
import requests

url = "http://localhost:8000/api/schools/plans/"
headers = {"X-Tenant-ID": "null"}
print(f"Testing GET {url} with headers {headers}")

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Content Type: {response.headers.get('Content-Type')}")
    with open("response_plans.html", "w", encoding='utf-8') as f:
        f.write(response.text)
    print(f"Body saved to response_plans.html (Size: {len(response.text)})")
except Exception as e:
    print(f"Request failed: {e}")

url_settings = "http://127.0.0.1:8000/api/settings/"
print(f"\nTesting GET {url_settings} with headers {headers}")
try:
    response = requests.get(url_settings, headers=headers)
    print(f"Status Code: {response.status_code}")
    with open("response_settings.html", "w", encoding='utf-8') as f:
        f.write(response.text)
    print(f"Body saved to response_settings.html (Size: {len(response.text)})")
except Exception as e:
    print(f"Request failed: {e}")
