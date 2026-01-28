import requests
import json

url = "http://127.0.0.1:8000/api/token/"
data = {
    "username": "dorcasmauyeme",
    "password": "password123" # I'll assume this is the password for testing
}
headers = {
    "Content-Type": "application/json",
    "X-Tenant-ID": "landmark"
}

print(f"Testing login for {data['username']} with tenant 'landmark'...")
response = requests.post(url, json=data, headers=headers)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
