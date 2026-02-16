import requests

BASE_URL = "http://localhost:8000/api/academic/data-migration"

def test_template_download():
    try:
        print("Testing Template Download...")
        # Note: This endpoint is protected, so this might fail 401/403 without a token.
        # But a 401 confirms the endpoint EXISTS and is reachable.
        response = requests.get(f"{BASE_URL}/student-template/")
        print(f"Status Code: {response.status_code}")
        if response.status_code in [200, 401, 403]:
            print("SUCCESS: Endpoint is reachable.")
        else:
            print(f"FAILURE: User unreachable. {response.text}")
    except Exception as e:
        print(f"FAILURE: Connection refused. {e}")

if __name__ == "__main__":
    test_template_download()
