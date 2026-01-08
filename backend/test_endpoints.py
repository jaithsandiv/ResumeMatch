"""
Quick test script to verify all API endpoints are working.
Run this while the server is running.
"""

import requests

BASE_URL = "http://127.0.0.1:8000"

def test_root():
    """Test root endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("✓ Root endpoint:", response.json())

def test_health_mongo():
    """Test MongoDB health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health/mongo")
        print("✓ MongoDB health:", response.json())
    except Exception as e:
        print("✗ MongoDB health:", str(e))

def test_swagger():
    """Test Swagger UI is accessible"""
    response = requests.get(f"{BASE_URL}/docs")
    if response.status_code == 200:
        print("✓ Swagger UI is accessible at http://127.0.0.1:8000/docs")
    else:
        print("✗ Swagger UI failed")

if __name__ == "__main__":
    print("\n=== Testing ResumeMatch Backend ===\n")
    test_root()
    test_health_mongo()
    test_swagger()
    print("\n=== All Tests Complete ===\n")
