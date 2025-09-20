import requests
import sys
from datetime import datetime

class TripFlowAPITester:
    def __init__(self, base_url="https://tripflow-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.users = {}
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text[:200]}")

            return success, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, email, password, role_name):
        """Test login for a specific user role"""
        success, response = self.run_test(
            f"Login - {role_name}",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.tokens[role_name] = response['access_token']
            self.users[role_name] = response.get('user', {})
            print(f"   ✅ Token obtained for {role_name}")
            print(f"   User: {response.get('user', {}).get('name', 'Unknown')}")
            return True
        return False

    def test_auth_me(self, role_name):
        """Test /auth/me endpoint"""
        if role_name not in self.tokens:
            print(f"❌ No token available for {role_name}")
            return False
            
        success, response = self.run_test(
            f"Auth Me - {role_name}",
            "GET",
            "auth/me",
            200,
            token=self.tokens[role_name]
        )
        if success:
            print(f"   User Role: {response.get('role', 'Unknown')}")
            print(f"   User Name: {response.get('name', 'Unknown')}")
        return success

    def test_dashboard_stats(self, role_name):
        """Test dashboard stats endpoint for specific role"""
        if role_name not in self.tokens:
            print(f"❌ No token available for {role_name}")
            return False
            
        success, response = self.run_test(
            f"Dashboard Stats - {role_name}",
            "GET",
            "dashboard/stats",
            200,
            token=self.tokens[role_name]
        )
        if success:
            print(f"   Stats keys: {list(response.keys())}")
            # Verify role-specific stats
            if role_name == "Customer":
                expected_keys = ["active_requests", "total_bookings", "pending_payments"]
            elif role_name == "Salesperson":
                expected_keys = ["assigned_requests", "pending_quotations", "conversion_rate", "avg_response_time"]
            elif role_name == "Sales Manager":
                expected_keys = ["team_performance", "pending_approvals", "monthly_revenue", "team_size"]
            elif role_name == "Operations":
                expected_keys = ["confirmed_bookings", "pending_payments", "upcoming_trips", "customer_satisfaction"]
            elif role_name == "Admin":
                expected_keys = ["total_users", "total_requests", "total_quotations", "system_health"]
            else:
                expected_keys = []
            
            missing_keys = [key for key in expected_keys if key not in response]
            if missing_keys:
                print(f"   ⚠️  Missing expected keys: {missing_keys}")
            else:
                print(f"   ✅ All expected keys present for {role_name}")
        return success

    def test_travel_requests(self, role_name):
        """Test travel requests endpoint"""
        if role_name not in self.tokens:
            print(f"❌ No token available for {role_name}")
            return False
            
        success, response = self.run_test(
            f"Travel Requests - {role_name}",
            "GET",
            "requests",
            200,
            token=self.tokens[role_name]
        )
        if success:
            print(f"   Found {len(response)} travel requests")
            if response:
                sample_request = response[0]
                print(f"   Sample request: {sample_request.get('title', 'No title')}")
        return success

    def test_quotations(self, role_name):
        """Test quotations endpoint"""
        if role_name not in self.tokens:
            print(f"❌ No token available for {role_name}")
            return False
            
        success, response = self.run_test(
            f"Quotations - {role_name}",
            "GET",
            "quotations",
            200,
            token=self.tokens[role_name]
        )
        if success:
            print(f"   Found {len(response)} quotations")
            if response:
                sample_quotation = response[0]
                print(f"   Sample quotation: {sample_quotation.get('title', 'No title')}")
        return success

    def test_bookings(self, role_name):
        """Test bookings endpoint"""
        if role_name not in self.tokens:
            print(f"❌ No token available for {role_name}")
            return False
            
        success, response = self.run_test(
            f"Bookings - {role_name}",
            "GET",
            "bookings",
            200,
            token=self.tokens[role_name]
        )
        if success:
            print(f"   Found {len(response)} bookings")
            if response:
                sample_booking = response[0]
                print(f"   Sample booking amount: {sample_booking.get('total_amount', 'No amount')}")
        return success

def main():
    print("🚀 Starting TripFlow B2B API Testing...")
    print("=" * 60)
    
    tester = TripFlowAPITester()
    
    # Demo user accounts
    demo_accounts = [
        ("customer@demo.com", "demo123", "Customer"),
        ("sales@demo.com", "demo123", "Salesperson"),
        ("manager@demo.com", "demo123", "Sales Manager"),
        ("ops@demo.com", "demo123", "Operations"),
        ("admin@demo.com", "demo123", "Admin")
    ]
    
    # Test authentication for all roles
    print("\n📋 AUTHENTICATION TESTING")
    print("-" * 40)
    login_success_count = 0
    for email, password, role_name in demo_accounts:
        if tester.test_login(email, password, role_name):
            login_success_count += 1
    
    print(f"\n✅ Login Success Rate: {login_success_count}/{len(demo_accounts)}")
    
    # Test /auth/me for all logged-in users
    print("\n📋 USER PROFILE TESTING")
    print("-" * 40)
    for _, _, role_name in demo_accounts:
        if role_name in tester.tokens:
            tester.test_auth_me(role_name)
    
    # Test dashboard stats for all roles
    print("\n📋 DASHBOARD STATS TESTING")
    print("-" * 40)
    for _, _, role_name in demo_accounts:
        if role_name in tester.tokens:
            tester.test_dashboard_stats(role_name)
    
    # Test data endpoints for all roles
    print("\n📋 DATA ENDPOINTS TESTING")
    print("-" * 40)
    for _, _, role_name in demo_accounts:
        if role_name in tester.tokens:
            tester.test_travel_requests(role_name)
            tester.test_quotations(role_name)
            tester.test_bookings(role_name)
    
    # Test unauthorized access
    print("\n📋 SECURITY TESTING")
    print("-" * 40)
    tester.run_test(
        "Unauthorized Dashboard Access",
        "GET",
        "dashboard/stats",
        401  # Should fail without token
    )
    
    tester.run_test(
        "Invalid Token Access",
        "GET",
        "dashboard/stats",
        401,  # Should fail with invalid token
        token="invalid-token-12345"
    )
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"Total Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())