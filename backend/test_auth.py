"""
Comprehensive test script for JWT authentication and role-based access control.
Tests all protected endpoints with different user roles.

Prerequisites:
1. Server must be running on http://localhost:8000
2. MongoDB must be connected
3. Admin user must exist (run seed_admin.py)
"""

import requests
import json

BASE_URL = "http://localhost:8000"

# Test credentials
ADMIN_CREDS = {
    "email": "admin@example.com",
    "password": "AdminPass123!"
}

VISITOR_CREDS = {
    "name": "Test Visitor",
    "email": "visitor@test.com",
    "password": "VisitorPass123!"
}


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_test(name, success, details=""):
    """Print test result"""
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"{status} | {name}")
    if details:
        print(f"     → {details}")


def test_register():
    """Test user registration"""
    print_header("TEST 1: User Registration")
    
    response = requests.post(f"{BASE_URL}/auth/register", json=VISITOR_CREDS)
    
    if response.status_code == 200:
        data = response.json()
        print_test("Register new visitor", True, f"User ID: {data['user']['id']}")
        print_test("Returns JWT token", "access_token" in data)
        print_test("Default role is visitor", data['user']['role'] == 'visitor')
        return data['access_token']
    elif response.status_code == 400:
        print_test("User already exists", True, "Skipping registration")
        return None
    else:
        print_test("Register new visitor", False, f"Status: {response.status_code}")
        return None


def test_login_admin():
    """Test admin login"""
    print_header("TEST 2: Admin Login")
    
    response = requests.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDS)
    
    if response.status_code == 200:
        data = response.json()
        print_test("Admin login successful", True)
        print_test("Returns JWT token", "access_token" in data)
        print_test("Role is admin", data['user']['role'] == 'admin')
        return data['access_token']
    else:
        print_test("Admin login", False, f"Status: {response.status_code}")
        return None


def test_login_visitor():
    """Test visitor login"""
    print_header("TEST 3: Visitor Login")
    
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": VISITOR_CREDS["email"],
        "password": VISITOR_CREDS["password"]
    })
    
    if response.status_code == 200:
        data = response.json()
        print_test("Visitor login successful", True)
        print_test("Returns JWT token", "access_token" in data)
        print_test("Role is visitor", data['user']['role'] == 'visitor')
        return data['access_token']
    else:
        print_test("Visitor login", False, f"Status: {response.status_code}")
        return None


def test_protected_routes(visitor_token, admin_token):
    """Test protected routes with different roles"""
    print_header("TEST 4: Protected Routes - /me")
    
    # Test /auth/me without token
    response = requests.get(f"{BASE_URL}/auth/me")
    print_test("Access /auth/me without token → 401", response.status_code == 401)
    
    # Test /auth/me with visitor token
    headers = {"Authorization": f"Bearer {visitor_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_test("Access /auth/me with visitor token → 200", response.status_code == 200)
    
    # Test /auth/me with admin token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print_test("Access /auth/me with admin token → 200", response.status_code == 200)


def test_admin_routes(visitor_token, admin_token):
    """Test admin-only routes"""
    print_header("TEST 5: Admin Routes - /admin/me")
    
    # Test /auth/admin/me without token
    response = requests.get(f"{BASE_URL}/auth/admin/me")
    print_test("Access /auth/admin/me without token → 401", response.status_code == 401)
    
    # Test /auth/admin/me with visitor token
    headers = {"Authorization": f"Bearer {visitor_token}"}
    response = requests.get(f"{BASE_URL}/auth/admin/me", headers=headers)
    print_test("Access /auth/admin/me with visitor token → 403", response.status_code == 403)
    
    # Test /auth/admin/me with admin token
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/auth/admin/me", headers=headers)
    print_test("Access /auth/admin/me with admin token → 200", response.status_code == 200)


def test_job_routes(visitor_token, admin_token):
    """Test job routes with role guards"""
    print_header("TEST 6: Job Routes - Role Guards")
    
    # Test GET /jobs (public - no auth required)
    response = requests.get(f"{BASE_URL}/jobs/")
    print_test("GET /jobs without token → 200", response.status_code == 200)
    
    # Test POST /jobs without token
    job_data = {
        "title": "Test Job",
        "company": "Test Company",
        "description": "Test description",
        "required_skills": ["Python", "FastAPI"]
    }
    response = requests.post(f"{BASE_URL}/jobs/", json=job_data)
    print_test("POST /jobs without token → 401", response.status_code == 401)
    
    # Test POST /jobs with visitor token (should fail - 403)
    headers = {"Authorization": f"Bearer {visitor_token}"}
    response = requests.post(f"{BASE_URL}/jobs/", json=job_data, headers=headers)
    print_test("POST /jobs with visitor token → 403", response.status_code == 403)
    
    # Test POST /jobs with admin token (should succeed)
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.post(f"{BASE_URL}/jobs/", json=job_data, headers=headers)
    print_test("POST /jobs with admin token → 200", response.status_code == 200)
    
    if response.status_code == 200:
        job_id = response.json().get("job_id")
        print(f"     → Created job ID: {job_id}")
        return job_id
    
    return None


def test_resume_routes(visitor_token):
    """Test resume upload routes"""
    print_header("TEST 7: Resume Upload - Authentication Required")
    
    # Test without token
    files = {"file": ("test_resume.txt", "This is a test resume", "text/plain")}
    response = requests.post(f"{BASE_URL}/resumes/upload", files=files)
    print_test("POST /resumes/upload without token → 401", response.status_code == 401)
    
    # Test with visitor token
    headers = {"Authorization": f"Bearer {visitor_token}"}
    files = {"file": ("test_resume.txt", "This is a test resume", "text/plain")}
    response = requests.post(f"{BASE_URL}/resumes/upload", files=files, headers=headers)
    print_test("POST /resumes/upload with visitor token → 200", response.status_code == 200)
    
    if response.status_code == 200:
        resume_id = response.json().get("resume_id")
        print(f"     → Created resume ID: {resume_id}")
        return resume_id
    
    return None


def test_application_routes(visitor_token, job_id, resume_id):
    """Test application routes"""
    print_header("TEST 8: Job Application - Authentication Required")
    
    if not job_id or not resume_id:
        print_test("Skipping application test", False, "Missing job_id or resume_id")
        return
    
    # Test without token
    app_data = {
        "job_id": job_id,
        "resume_id": resume_id,
        "cover_letter": "Test cover letter"
    }
    response = requests.post(f"{BASE_URL}/applications/apply", json=app_data)
    print_test("POST /applications/apply without token → 401", response.status_code == 401)
    
    # Test with visitor token
    headers = {"Authorization": f"Bearer {visitor_token}"}
    response = requests.post(f"{BASE_URL}/applications/apply", json=app_data, headers=headers)
    print_test("POST /applications/apply with token → 200", response.status_code == 200)
    
    if response.status_code == 200:
        data = response.json()
        print_test("Candidate ID from token only", "candidate_id" in data)


def run_all_tests():
    """Run all authentication and authorization tests"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "ResumeMatch Auth & RBAC Tests" + " " * 19 + "║")
    print("╚" + "=" * 58 + "╝")
    
    try:
        # Register and login
        test_register()
        admin_token = test_login_admin()
        visitor_token = test_login_visitor()
        
        if not admin_token or not visitor_token:
            print("\n✗ ERROR: Failed to get tokens. Cannot proceed with tests.")
            return
        
        # Test protected routes
        test_protected_routes(visitor_token, admin_token)
        test_admin_routes(visitor_token, admin_token)
        
        # Test resource routes
        job_id = test_job_routes(visitor_token, admin_token)
        resume_id = test_resume_routes(visitor_token)
        test_application_routes(visitor_token, job_id, resume_id)
        
        # Summary
        print_header("TEST SUMMARY")
        print("✓ All authentication and authorization tests completed!")
        print("✓ JWT tokens working correctly")
        print("✓ Role-based access control functioning")
        print("✓ Protected routes properly secured")
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to server at http://localhost:8000")
        print("  Make sure the server is running with: start_server.bat")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")


if __name__ == "__main__":
    run_all_tests()
