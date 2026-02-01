#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class FundFlowAPITester:
    def __init__(self, base_url="https://fundraiserpro.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_collection_id = None
        self.test_order_id = None
        self.test_token = None
        self.test_user_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        if details:
            print(f"   Details: {details}")
        print()

    def test_api_root(self):
        """Test GET /api/ endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("API Root Endpoint", False, str(e))
            return False

    def test_get_categories(self):
        """Test GET /api/categories endpoint"""
        try:
            response = requests.get(f"{self.api_url}/categories", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                categories = data.get('categories', [])
                details += f", Categories count: {len(categories)}"
                # Check if required categories exist
                category_ids = [cat.get('id') for cat in categories]
                expected_categories = ['celebration', 'medical', 'festival', 'society', 'social', 'office']
                missing = [cat for cat in expected_categories if cat not in category_ids]
                if missing:
                    details += f", Missing categories: {missing}"
            self.log_test("Get Categories", success, details)
            return success
        except Exception as e:
            self.log_test("Get Categories", False, str(e))
            return False

    def test_get_stats(self):
        """Test GET /api/stats endpoint"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                required_fields = ['total_collections', 'total_donations', 'total_raised']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Collections: {data['total_collections']}, Donations: {data['total_donations']}, Raised: ₹{data['total_raised']}"
            self.log_test("Get Platform Stats", success, details)
            return success
        except Exception as e:
            self.log_test("Get Platform Stats", False, str(e))
            return False

    def test_user_registration(self):
        """Test POST /api/auth/register endpoint"""
        try:
            # Generate unique test user
            timestamp = datetime.now().strftime('%H%M%S')
            test_data = {
                "name": f"Test User {timestamp}",
                "email": f"testuser{timestamp}@example.com",
                "password": "testpass123",
                "phone": "9876543210"
            }
            
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.test_token = data.get('access_token')
                user_data = data.get('user', {})
                self.test_user_id = user_data.get('id')
                
                # Verify required fields in response
                required_fields = ['access_token', 'token_type', 'user']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing response fields: {missing_fields}"
                else:
                    details += f", User ID: {self.test_user_id}, Token received: {'Yes' if self.test_token else 'No'}"
                    
                # Verify user object structure
                user_required_fields = ['id', 'name', 'email']
                user_missing_fields = [field for field in user_required_fields if field not in user_data]
                if user_missing_fields:
                    success = False
                    details += f", Missing user fields: {user_missing_fields}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("User Registration", success, details)
            return success
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False

    def test_user_login(self):
        """Test POST /api/auth/login endpoint"""
        try:
            # Use existing test user or create a new one
            if not hasattr(self, 'test_email'):
                timestamp = datetime.now().strftime('%H%M%S')
                self.test_email = f"logintest{timestamp}@example.com"
                self.test_password = "testpass123"
                
                # First register a user to login with
                register_data = {
                    "name": f"Login Test User {timestamp}",
                    "email": self.test_email,
                    "password": self.test_password
                }
                
                register_response = requests.post(
                    f"{self.api_url}/auth/register",
                    json=register_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=10
                )
                
                if register_response.status_code != 200:
                    self.log_test("User Login (Setup)", False, "Failed to create test user for login")
                    return False
            
            # Now test login
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.test_token = data.get('access_token')  # Update token for subsequent tests
                user_data = data.get('user', {})
                
                # Verify required fields in response
                required_fields = ['access_token', 'token_type', 'user']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing response fields: {missing_fields}"
                else:
                    details += f", Email: {user_data.get('email')}, Token received: {'Yes' if self.test_token else 'No'}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_get_current_user(self):
        """Test GET /api/auth/me endpoint (requires authentication)"""
        if not self.test_token:
            self.log_test("Get Current User", False, "No authentication token available")
            return False
            
        try:
            headers = {
                'Authorization': f'Bearer {self.test_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                required_fields = ['id', 'name', 'email', 'created_at']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", User: {data.get('name')} ({data.get('email')})"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("Get Current User", success, details)
            return success
        except Exception as e:
            self.log_test("Get Current User", False, str(e))
            return False

    def test_collections_requires_auth(self):
        """Test POST /api/collections endpoint requires authentication (should return 401 without token)"""
        try:
            test_data = {
                "title": "Test Collection - No Auth",
                "description": "This should fail without authentication",
                "category": "celebration",
                "goal_amount": 1000.0,
                "organizer_name": "Test Organizer",
                "organizer_email": "test@example.com"
            }
            
            # Test without authentication token
            response = requests.post(
                f"{self.api_url}/collections", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 401
            details = f"Status: {response.status_code} (Expected: 401)"
            
            if success:
                details += ", Correctly rejected unauthenticated request"
            else:
                try:
                    error_data = response.json()
                    details += f", Unexpected response: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("Collections Requires Auth", success, details)
            return success
        except Exception as e:
            self.log_test("Collections Requires Auth", False, str(e))
            return False

    def test_create_collection(self):
        """Test POST /api/collections endpoint (with authentication)"""
        if not self.test_token:
            self.log_test("Create Collection", False, "No authentication token available")
            return False
            
        try:
            test_data = {
                "title": f"Test Collection {datetime.now().strftime('%H%M%S')}",
                "description": "This is a test collection created by automated testing script.",
                "category": "celebration",
                "goal_amount": 5000.0,
                "visibility": "public",
                "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
                "organizer_name": "Test Organizer",
                "organizer_email": "test@example.com",
                "organizer_phone": "9876543210"
            }
            
            headers = {
                'Authorization': f'Bearer {self.test_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.api_url}/collections", 
                json=test_data,
                headers=headers,
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.test_collection_id = data.get('id')
                details += f", Collection ID: {self.test_collection_id}"
                # Verify required fields in response
                required_fields = ['id', 'title', 'description', 'category', 'goal_amount', 'current_amount', 'organizer_name']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing response fields: {missing_fields}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("Create Collection (Authenticated)", success, details)
            return success
        except Exception as e:
            self.log_test("Create Collection (Authenticated)", False, str(e))
            return False
        """Test POST /api/collections endpoint"""
        try:
            test_data = {
                "title": f"Test Collection {datetime.now().strftime('%H%M%S')}",
                "description": "This is a test collection created by automated testing script.",
                "category": "celebration",
                "goal_amount": 5000.0,
                "visibility": "public",
                "deadline": (datetime.now() + timedelta(days=30)).isoformat(),
                "organizer_name": "Test Organizer",
                "organizer_email": "test@example.com",
                "organizer_phone": "9876543210"
            }
            
            response = requests.post(
                f"{self.api_url}/collections", 
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.test_collection_id = data.get('id')
                details += f", Collection ID: {self.test_collection_id}"
                # Verify required fields in response
                required_fields = ['id', 'title', 'description', 'category', 'goal_amount', 'current_amount', 'organizer_name']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing response fields: {missing_fields}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("Create Collection", success, details)
            return success
        except Exception as e:
            self.log_test("Create Collection", False, str(e))
            return False

    def test_get_collections(self):
        """Test GET /api/collections endpoint"""
        try:
            response = requests.get(f"{self.api_url}/collections?limit=10", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Collections count: {len(data)}"
                    if len(data) > 0:
                        # Check first collection structure
                        first_collection = data[0]
                        required_fields = ['id', 'title', 'description', 'category', 'goal_amount', 'current_amount']
                        missing_fields = [field for field in required_fields if field not in first_collection]
                        if missing_fields:
                            details += f", Missing fields in collection: {missing_fields}"
                else:
                    success = False
                    details += ", Response is not a list"
            
            self.log_test("Get Collections List", success, details)
            return success
        except Exception as e:
            self.log_test("Get Collections List", False, str(e))
            return False

    def test_get_collection_by_id(self):
        """Test GET /api/collections/{id} endpoint"""
        if not self.test_collection_id:
            # Try with one of the provided test collection IDs
            self.test_collection_id = "d9230f56-83c1-4082-adb8-9273c4177e65"
        
        try:
            response = requests.get(f"{self.api_url}/collections/{self.test_collection_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Collection ID: {self.test_collection_id}"
            
            if success:
                data = response.json()
                required_fields = ['id', 'title', 'description', 'category', 'goal_amount', 'current_amount', 'organizer_name']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Title: {data.get('title', 'N/A')[:30]}..."
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"
                    
            self.log_test("Get Collection by ID", success, details)
            return success
        except Exception as e:
            self.log_test("Get Collection by ID", False, str(e))
            return False

    def test_get_collection_donations(self):
        """Test GET /api/collections/{id}/donations endpoint"""
        collection_id = self.test_collection_id or "d9230f56-83c1-4082-adb8-9273c4177e65"
        
        try:
            response = requests.get(f"{self.api_url}/collections/{collection_id}/donations", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Collection ID: {collection_id}"
            
            if success:
                data = response.json()
                if isinstance(data, list):
                    details += f", Donations count: {len(data)}"
                    if len(data) > 0:
                        # Check first donation structure
                        first_donation = data[0]
                        required_fields = ['id', 'collection_id', 'donor_name', 'amount', 'status']
                        missing_fields = [field for field in required_fields if field not in first_donation]
                        if missing_fields:
                            details += f", Missing fields in donation: {missing_fields}"
                else:
                    success = False
                    details += ", Response is not a list"
            
            self.log_test("Get Collection Donations", success, details)
            return success
        except Exception as e:
            self.log_test("Get Collection Donations", False, str(e))
            return False

    def test_create_payment_order(self):
        """Test POST /api/payments/create-order endpoint"""
        collection_id = self.test_collection_id or "d9230f56-83c1-4082-adb8-9273c4177e65"
        
        try:
            test_data = {
                "collection_id": collection_id,
                "donor_name": "Test Donor",
                "donor_email": "testdonor@example.com",
                "donor_phone": "9876543210",
                "amount": 100.0,
                "message": "Test donation from automated testing",
                "anonymous": False
            }
            
            response = requests.post(
                f"{self.api_url}/payments/create-order",
                json=test_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                self.test_order_id = data.get('order_id')
                required_fields = ['order_id', 'cf_order_id', 'payment_session_id', 'order_status']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing response fields: {missing_fields}"
                else:
                    details += f", Order ID: {self.test_order_id}, CF Order ID: {data.get('cf_order_id')}"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:200]}"
                    
            self.log_test("Create Payment Order", success, details)
            return success
        except Exception as e:
            self.log_test("Create Payment Order", False, str(e))
            return False

    def test_verify_payment(self):
        """Test GET /api/payments/verify/{order_id} endpoint"""
        if not self.test_order_id:
            self.log_test("Verify Payment", False, "No test order ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/payments/verify/{self.test_order_id}", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Order ID: {self.test_order_id}"
            
            if success:
                data = response.json()
                required_fields = ['order_id', 'status']
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    success = False
                    details += f", Missing fields: {missing_fields}"
                else:
                    details += f", Payment Status: {data.get('status')}"
            
            self.log_test("Verify Payment", success, details)
            return success
        except Exception as e:
            self.log_test("Verify Payment", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting FundFlow API Tests")
        print("=" * 50)
        
        # Basic API tests
        self.test_api_root()
        self.test_get_categories()
        self.test_get_stats()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        self.test_collections_requires_auth()
        
        # Collection tests (with authentication)
        self.test_create_collection()
        self.test_get_collections()
        self.test_get_collection_by_id()
        self.test_get_collection_donations()
        
        # Payment tests
        self.test_create_payment_order()
        self.test_verify_payment()
        
        # Summary
        print("=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    tester = FundFlowAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())