from fastapi import FastAPI, APIRouter, HTTPException, Request, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import hashlib
import hmac
import base64
import json
import aiohttp
from jose import JWTError, jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Cashfree configuration
CASHFREE_CLIENT_ID = os.environ.get('CASHFREE_CLIENT_ID')
CASHFREE_SECRET_KEY = os.environ.get('CASHFREE_SECRET_KEY')
CASHFREE_ENVIRONMENT = os.environ.get('CASHFREE_ENVIRONMENT', 'SANDBOX')
CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg" if CASHFREE_ENVIRONMENT == 'SANDBOX' else "https://api.cashfree.com/pg"

# Cashfree Payout configuration
CASHFREE_PAYOUT_CLIENT_ID = os.environ.get('CASHFREE_PAYOUT_CLIENT_ID')
CASHFREE_PAYOUT_SECRET_KEY = os.environ.get('CASHFREE_PAYOUT_SECRET_KEY')
CASHFREE_PAYOUT_BASE_URL = "https://payout-gamma.cashfree.com" if CASHFREE_ENVIRONMENT == 'SANDBOX' else "https://payout-api.cashfree.com"

# Admin credentials (for demo - in production use proper auth)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@fundflow.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'fundflow-secret-key-change-in-production-2026')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)

# Create the main app
app = FastAPI(title="FundFlow API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ==================== ENUMS ====================
class CollectionVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class CollectionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"

class KYCStatus(str, Enum):
    NOT_SUBMITTED = "not_submitted"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WithdrawalStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ==================== AUTH MODELS ====================
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    created_at: str
    kyc_status: Optional[str] = "not_submitted"
    is_admin: Optional[bool] = False

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ==================== KYC MODELS ====================
class KYCSubmit(BaseModel):
    pan_number: str
    aadhaar_number: str
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_holder: Optional[str] = None
    upi_id: Optional[str] = None

class KYCResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    pan_number: str
    aadhaar_last_four: str
    bank_account_last_four: Optional[str] = None
    bank_ifsc: Optional[str] = None
    upi_id: Optional[str] = None
    status: str
    rejection_reason: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== WITHDRAWAL MODELS ====================
class WithdrawalRequest(BaseModel):
    collection_id: str
    amount: float
    payout_mode: str  # "bank" or "upi"

class WithdrawalResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    collection_id: str
    amount: float
    platform_fee: float
    net_amount: float
    payout_mode: str
    status: str
    cf_transfer_id: Optional[str] = None
    failure_reason: Optional[str] = None
    created_at: str
    updated_at: str


# ==================== ADMIN MODELS ====================
class PlatformSettings(BaseModel):
    platform_fee_percentage: float = 2.5

class KYCReview(BaseModel):
    status: str  # "approved" or "rejected"
    rejection_reason: Optional[str] = None


# ==================== AUTH HELPER FUNCTIONS ====================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[dict]:
    """Get current user from JWT token - returns None if not authenticated"""
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    except JWTError:
        return None

async def get_required_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user - raises exception if not authenticated"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user and verify they are admin"""
    user = await get_required_user(credentials)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ==================== MODELS ====================
class CollectionCreate(BaseModel):
    title: str
    description: str
    category: str
    goal_amount: float
    visibility: CollectionVisibility = CollectionVisibility.PUBLIC
    deadline: Optional[str] = None
    cover_image: Optional[str] = None
    organizer_name: str
    organizer_email: EmailStr
    organizer_phone: Optional[str] = None

class CollectionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    category: str
    goal_amount: float
    current_amount: float
    withdrawn_amount: float = 0.0
    available_amount: float = 0.0
    visibility: str
    status: str
    deadline: Optional[str] = None
    cover_image: Optional[str] = None
    organizer_name: str
    donor_count: int
    created_at: str
    share_link: str

class DonationCreate(BaseModel):
    collection_id: str
    donor_name: str
    donor_email: EmailStr
    donor_phone: Optional[str] = None
    amount: float
    message: Optional[str] = None
    anonymous: bool = False

class DonationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    collection_id: str
    donor_name: str
    amount: float
    message: Optional[str] = None
    anonymous: bool
    status: str
    created_at: str

class PaymentOrderCreate(BaseModel):
    collection_id: str
    donor_name: str
    donor_email: EmailStr
    donor_phone: str
    amount: float
    message: Optional[str] = None
    anonymous: bool = False

class PaymentOrderResponse(BaseModel):
    order_id: str
    cf_order_id: str
    payment_session_id: str
    order_status: str


# ==================== HELPER FUNCTIONS ====================
def generate_share_link(collection_id: str) -> str:
    """Generate a unique share link for a collection"""
    return f"/collection/{collection_id}"

def get_category_image(category: str) -> str:
    """Get default image based on category"""
    category_images = {
        "celebration": "https://images.unsplash.com/photo-1758272133831-510256416378",
        "medical": "https://images.unsplash.com/photo-1581056771107-24ca5f033842",
        "festival": "https://images.unsplash.com/photo-1599807502285-4b218782d601",
        "society": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7",
        "social": "https://images.unsplash.com/photo-1708593343700-a101f8fe4d11",
        "office": "https://images.unsplash.com/photo-1758691737182-d42aefd6dee8",
    }
    return category_images.get(category.lower(), "https://images.unsplash.com/photo-1556761175-5973dc0f32e7")


# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    try:
        # Check if email already exists
        existing_user = await db.users.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        user_doc = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email.lower(),
            "password": get_password_hash(user_data.password),
            "phone": user_data.phone,
            "created_at": now,
            "updated_at": now
        }
        
        await db.users.insert_one(user_doc)
        logger.info(f"User registered: {user_id}")
        
        # Create access token
        access_token = create_access_token(data={"sub": user_id})
        
        user_response = UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email.lower(),
            phone=user_data.phone,
            created_at=now
        )
        
        return TokenResponse(
            access_token=access_token,
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user"""
    try:
        # Find user by email
        user = await db.users.find_one({"email": credentials.email.lower()})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(credentials.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"]})
        
        user_response = UserResponse(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            phone=user.get("phone"),
            created_at=user["created_at"]
        )
        
        return TokenResponse(
            access_token=access_token,
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_required_user)):
    """Get current logged in user"""
    return UserResponse(**current_user)


# ==================== COLLECTION ENDPOINTS ====================
@api_router.get("/")
async def root():
    return {"message": "FundFlow API - Group Collection Platform"}

@api_router.post("/collections", response_model=CollectionResponse)
async def create_collection(collection: CollectionCreate, current_user: dict = Depends(get_required_user)):
    """Create a new collection/activity - requires authentication"""
    try:
        collection_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": collection_id,
            "user_id": current_user["id"],
            "title": collection.title,
            "description": collection.description,
            "category": collection.category,
            "goal_amount": collection.goal_amount,
            "current_amount": 0.0,
            "visibility": collection.visibility.value,
            "status": CollectionStatus.ACTIVE.value,
            "deadline": collection.deadline,
            "cover_image": collection.cover_image or get_category_image(collection.category),
            "organizer_name": collection.organizer_name,
            "organizer_email": collection.organizer_email,
            "organizer_phone": collection.organizer_phone,
            "donor_count": 0,
            "created_at": now,
            "updated_at": now,
            "share_link": generate_share_link(collection_id),
            "gallery": []
        }
        
        await db.collections.insert_one(doc)
        logger.info(f"Collection created: {collection_id}")
        
        return CollectionResponse(**doc)
    except Exception as e:
        logger.error(f"Error creating collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    visibility: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all public collections with optional filters"""
    try:
        query = {"status": CollectionStatus.ACTIVE.value}
        
        # By default, only show public collections
        if visibility:
            query["visibility"] = visibility
        else:
            query["visibility"] = CollectionVisibility.PUBLIC.value
            
        if category:
            query["category"] = category
        
        cursor = db.collections.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1)
        collections = await cursor.to_list(length=limit)
        
        return [CollectionResponse(**c) for c in collections]
    except Exception as e:
        logger.error(f"Error fetching collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(collection_id: str):
    """Get a single collection by ID (works for both public and private)"""
    try:
        doc = await db.collections.find_one({"id": collection_id}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Collection not found")
        return CollectionResponse(**doc)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching collection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/collections/{collection_id}/donations", response_model=List[DonationResponse])
async def get_collection_donations(
    collection_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get donations for a collection"""
    try:
        # Verify collection exists
        collection = await db.collections.find_one({"id": collection_id}, {"_id": 0})
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        
        cursor = db.donations.find(
            {"collection_id": collection_id, "status": PaymentStatus.SUCCESS.value},
            {"_id": 0}
        ).skip(skip).limit(limit).sort("created_at", -1)
        
        donations = await cursor.to_list(length=limit)
        
        # Mask donor name for anonymous donations
        for d in donations:
            if d.get("anonymous"):
                d["donor_name"] = "Anonymous"
        
        return [DonationResponse(**d) for d in donations]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching donations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/categories")
async def get_categories():
    """Get available collection categories"""
    return {
        "categories": [
            {"id": "celebration", "name": "Celebration", "icon": "party-popper"},
            {"id": "medical", "name": "Medical Emergency", "icon": "heart-pulse"},
            {"id": "festival", "name": "Festival", "icon": "sparkles"},
            {"id": "society", "name": "Society/Community", "icon": "home"},
            {"id": "social", "name": "Social Cause", "icon": "hand-heart"},
            {"id": "office", "name": "Office/Team", "icon": "briefcase"},
            {"id": "reunion", "name": "Reunion", "icon": "users"},
            {"id": "other", "name": "Other", "icon": "folder"},
        ]
    }

@api_router.get("/my-collections", response_model=List[CollectionResponse])
async def get_my_collections(
    current_user: dict = Depends(get_required_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
):
    """Get collections created by the current user"""
    try:
        cursor = db.collections.find(
            {"user_id": current_user["id"]}, 
            {"_id": 0}
        ).skip(skip).limit(limit).sort("created_at", -1)
        collections = await cursor.to_list(length=limit)
        return [CollectionResponse(**c) for c in collections]
    except Exception as e:
        logger.error(f"Error fetching user collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PAYMENT ENDPOINTS ====================
@api_router.post("/payments/create-order", response_model=PaymentOrderResponse)
async def create_payment_order(payment: PaymentOrderCreate):
    """Create a payment order with Cashfree"""
    try:
        # Verify collection exists and is active
        collection = await db.collections.find_one({"id": payment.collection_id}, {"_id": 0})
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
        if collection.get("status") != CollectionStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Collection is no longer accepting donations")
        
        # Generate unique order ID
        order_id = f"order_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Create order via Cashfree HTTP API
        base_url = os.environ.get('API_BASE_URL', 'http://localhost:3000')
        
        order_payload = {
            "order_id": order_id,
            "order_amount": payment.amount,
            "order_currency": "INR",
            "customer_details": {
                "customer_id": f"donor_{uuid.uuid4().hex[:8]}",
                "customer_name": payment.donor_name,
                "customer_email": payment.donor_email,
                "customer_phone": payment.donor_phone
            },
            "order_meta": {
                "return_url": f"{base_url}/payment/callback?order_id={order_id}",
                "notify_url": f"{os.environ.get('WEBHOOK_URL', base_url)}/api/webhooks/payment"
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-client-id": CASHFREE_CLIENT_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{CASHFREE_BASE_URL}/orders",
                json=order_payload,
                headers=headers
            ) as resp:
                cf_response = await resp.json()
                
                if resp.status != 200:
                    logger.error(f"Cashfree order creation failed: {cf_response}")
                    raise HTTPException(
                        status_code=400, 
                        detail=cf_response.get("message", "Failed to create payment order")
                    )
        
        cf_order_id = cf_response.get("cf_order_id")
        payment_session_id = cf_response.get("payment_session_id")
        order_status = cf_response.get("order_status")
        
        # Store donation record (pending)
        donation_doc = {
            "id": str(uuid.uuid4()),
            "collection_id": payment.collection_id,
            "order_id": order_id,
            "cf_order_id": cf_order_id,
            "donor_name": payment.donor_name,
            "donor_email": payment.donor_email,
            "donor_phone": payment.donor_phone,
            "amount": payment.amount,
            "message": payment.message,
            "anonymous": payment.anonymous,
            "status": PaymentStatus.PENDING.value,
            "payment_session_id": payment_session_id,
            "created_at": now,
            "updated_at": now
        }
        
        await db.donations.insert_one(donation_doc)
        logger.info(f"Payment order created: {order_id} for collection {payment.collection_id}")
        
        return PaymentOrderResponse(
            order_id=order_id,
            cf_order_id=cf_order_id,
            payment_session_id=payment_session_id,
            order_status=order_status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment order: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/verify/{order_id}")
async def verify_payment(order_id: str):
    """Verify payment status from Cashfree"""
    try:
        # Get donation record
        donation = await db.donations.find_one({"order_id": order_id}, {"_id": 0})
        if not donation:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # If already processed, just return current status
        if donation.get("status") in [PaymentStatus.SUCCESS.value, PaymentStatus.FAILED.value]:
            return {
                "order_id": order_id,
                "status": donation.get("status"),
                "cf_order_status": "PAID" if donation.get("status") == PaymentStatus.SUCCESS.value else "FAILED",
                "amount": donation.get("amount"),
                "collection_id": donation.get("collection_id")
            }
        
        # Call Cashfree to verify order status via HTTP API
        headers = {
            "x-client-id": CASHFREE_CLIENT_ID,
            "x-client-secret": CASHFREE_SECRET_KEY,
            "x-api-version": "2023-08-01"
        }
        
        order_status = None
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{CASHFREE_BASE_URL}/orders/{order_id}",
                    headers=headers
                ) as resp:
                    if resp.status == 200:
                        cf_response = await resp.json()
                        order_status = cf_response.get("order_status")
        except Exception as e:
            logger.error(f"Error fetching order from Cashfree: {e}")
        
        if not order_status:
            return {"status": donation.get("status"), "message": "Unable to verify with payment gateway"}
        
        # Update local record if status changed
        new_status = donation.get("status")
        if order_status == "PAID":
            new_status = PaymentStatus.SUCCESS.value
        elif order_status in ["EXPIRED", "CANCELLED"]:
            new_status = PaymentStatus.FAILED.value
        
        if new_status != donation.get("status"):
            # Use findOneAndUpdate to prevent race conditions
            result = await db.donations.find_one_and_update(
                {"order_id": order_id, "status": PaymentStatus.PENDING.value},
                {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}},
                return_document=False
            )
            
            # Only update collection if we actually changed the status (result is not None)
            if result and new_status == PaymentStatus.SUCCESS.value:
                await db.collections.update_one(
                    {"id": donation["collection_id"]},
                    {
                        "$inc": {"current_amount": donation["amount"], "donor_count": 1},
                        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                    }
                )
                logger.info(f"Payment successful for order {order_id} (via verify)")
        
        return {
            "order_id": order_id,
            "status": new_status,
            "cf_order_status": order_status,
            "amount": donation.get("amount"),
            "collection_id": donation.get("collection_id")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying payment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WEBHOOK ENDPOINT ====================
@api_router.post("/webhooks/payment")
async def payment_webhook(request: Request):
    """Handle Cashfree payment webhooks"""
    try:
        body = await request.body()
        payload = json.loads(body)
        
        logger.info(f"Webhook received: {payload.get('type')}")
        
        event_type = payload.get("type")
        order_data = payload.get("data", {})
        order_info = order_data.get("order", {})
        payment_info = order_data.get("payment", {})
        
        order_id = order_info.get("order_id")
        if not order_id:
            return {"status": "ignored", "reason": "No order_id in payload"}
        
        # Get donation record
        donation = await db.donations.find_one({"order_id": order_id}, {"_id": 0})
        if not donation:
            logger.warning(f"Webhook for unknown order: {order_id}")
            return {"status": "ignored", "reason": "Order not found"}
        
        # Skip if already processed
        if donation.get("status") in [PaymentStatus.SUCCESS.value, PaymentStatus.FAILED.value]:
            logger.info(f"Webhook for already processed order: {order_id}")
            return {"status": "already_processed"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        if event_type == "PAYMENT_SUCCESS_WEBHOOK":
            # Use findOneAndUpdate to prevent race conditions - only update if still pending
            result = await db.donations.find_one_and_update(
                {"order_id": order_id, "status": PaymentStatus.PENDING.value},
                {
                    "$set": {
                        "status": PaymentStatus.SUCCESS.value,
                        "cf_payment_id": payment_info.get("cf_payment_id"),
                        "payment_method": payment_info.get("payment_method"),
                        "updated_at": now
                    }
                },
                return_document=False
            )
            
            # Only update collection if we actually changed the status
            if result:
                await db.collections.update_one(
                    {"id": donation["collection_id"]},
                    {
                        "$inc": {"current_amount": donation["amount"], "donor_count": 1},
                        "$set": {"updated_at": now}
                    }
                )
                logger.info(f"Payment webhook: SUCCESS for order {order_id}")
            else:
                logger.info(f"Payment webhook: order {order_id} already processed")
            
        elif event_type == "PAYMENT_FAILED_WEBHOOK":
            await db.donations.update_one(
                {"order_id": order_id, "status": PaymentStatus.PENDING.value},
                {"$set": {"status": PaymentStatus.FAILED.value, "updated_at": now}}
            )
            logger.info(f"Payment webhook: FAILED for order {order_id}")
        
        return {"status": "processed"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


# ==================== KYC ENDPOINTS ====================
@api_router.post("/kyc/submit", response_model=KYCResponse)
async def submit_kyc(kyc_data: KYCSubmit, current_user: dict = Depends(get_required_user)):
    """Submit KYC documents for verification"""
    try:
        # Check if KYC already submitted
        existing_kyc = await db.kyc.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if existing_kyc and existing_kyc.get("status") == KYCStatus.APPROVED.value:
            raise HTTPException(status_code=400, detail="KYC already approved")
        
        # Validate: either bank account or UPI must be provided
        if not kyc_data.bank_account_number and not kyc_data.upi_id:
            raise HTTPException(status_code=400, detail="Either bank account or UPI ID is required")
        
        if kyc_data.bank_account_number and (not kyc_data.bank_ifsc or not kyc_data.bank_account_holder):
            raise HTTPException(status_code=400, detail="Bank IFSC and account holder name required with bank account")
        
        now = datetime.now(timezone.utc).isoformat()
        kyc_id = existing_kyc["id"] if existing_kyc else str(uuid.uuid4())
        
        kyc_doc = {
            "id": kyc_id,
            "user_id": current_user["id"],
            "pan_number": kyc_data.pan_number.upper(),
            "aadhaar_number": kyc_data.aadhaar_number,  # Store encrypted in production
            "bank_account_number": kyc_data.bank_account_number,
            "bank_ifsc": kyc_data.bank_ifsc.upper() if kyc_data.bank_ifsc else None,
            "bank_account_holder": kyc_data.bank_account_holder,
            "upi_id": kyc_data.upi_id,
            "status": KYCStatus.PENDING.value,
            "rejection_reason": None,
            "created_at": existing_kyc["created_at"] if existing_kyc else now,
            "updated_at": now
        }
        
        if existing_kyc:
            await db.kyc.update_one({"id": kyc_id}, {"$set": kyc_doc})
        else:
            await db.kyc.insert_one(kyc_doc)
        
        # Update user's KYC status
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {"kyc_status": KYCStatus.PENDING.value}}
        )
        
        logger.info(f"KYC submitted for user {current_user['id']}")
        
        return KYCResponse(
            id=kyc_id,
            user_id=current_user["id"],
            pan_number=kyc_data.pan_number[:5] + "****" + kyc_data.pan_number[-1],
            aadhaar_last_four=kyc_data.aadhaar_number[-4:],
            bank_account_last_four=kyc_data.bank_account_number[-4:] if kyc_data.bank_account_number else None,
            bank_ifsc=kyc_data.bank_ifsc,
            upi_id=kyc_data.upi_id,
            status=KYCStatus.PENDING.value,
            rejection_reason=None,
            created_at=kyc_doc["created_at"],
            updated_at=now
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting KYC: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/kyc/status", response_model=KYCResponse)
async def get_kyc_status(current_user: dict = Depends(get_required_user)):
    """Get current user's KYC status"""
    try:
        kyc = await db.kyc.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not kyc:
            raise HTTPException(status_code=404, detail="KYC not submitted")
        
        return KYCResponse(
            id=kyc["id"],
            user_id=kyc["user_id"],
            pan_number=kyc["pan_number"][:5] + "****" + kyc["pan_number"][-1],
            aadhaar_last_four=kyc["aadhaar_number"][-4:],
            bank_account_last_four=kyc["bank_account_number"][-4:] if kyc.get("bank_account_number") else None,
            bank_ifsc=kyc.get("bank_ifsc"),
            upi_id=kyc.get("upi_id"),
            status=kyc["status"],
            rejection_reason=kyc.get("rejection_reason"),
            created_at=kyc["created_at"],
            updated_at=kyc["updated_at"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching KYC status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WITHDRAWAL ENDPOINTS ====================
@api_router.post("/withdrawals/request", response_model=WithdrawalResponse)
async def request_withdrawal(request: WithdrawalRequest, current_user: dict = Depends(get_required_user)):
    """Request withdrawal of funds from a collection"""
    try:
        # Check KYC status
        if current_user.get("kyc_status") != KYCStatus.APPROVED.value:
            raise HTTPException(status_code=400, detail="KYC must be approved before withdrawal")
        
        # Verify collection belongs to user
        collection = await db.collections.find_one(
            {"id": request.collection_id, "user_id": current_user["id"]},
            {"_id": 0}
        )
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found or not owned by you")
        
        # Calculate available amount (total raised - already withdrawn)
        withdrawn_amount = collection.get("withdrawn_amount", 0)
        available_amount = collection["current_amount"] - withdrawn_amount
        
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
        
        if request.amount > available_amount:
            raise HTTPException(status_code=400, detail=f"Insufficient balance. Available: ₹{available_amount}")
        
        # Get platform fee
        settings = await db.settings.find_one({"key": "platform"}, {"_id": 0})
        fee_percentage = settings.get("platform_fee_percentage", 2.5) if settings else 2.5
        
        platform_fee = round(request.amount * fee_percentage / 100, 2)
        net_amount = round(request.amount - platform_fee, 2)
        
        # Get KYC for payout details
        kyc = await db.kyc.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not kyc:
            raise HTTPException(status_code=400, detail="KYC details not found")
        
        # Validate payout mode
        if request.payout_mode == "bank" and not kyc.get("bank_account_number"):
            raise HTTPException(status_code=400, detail="Bank account not registered in KYC")
        if request.payout_mode == "upi" and not kyc.get("upi_id"):
            raise HTTPException(status_code=400, detail="UPI ID not registered in KYC")
        
        now = datetime.now(timezone.utc).isoformat()
        withdrawal_id = str(uuid.uuid4())
        
        withdrawal_doc = {
            "id": withdrawal_id,
            "user_id": current_user["id"],
            "collection_id": request.collection_id,
            "amount": request.amount,
            "platform_fee": platform_fee,
            "net_amount": net_amount,
            "payout_mode": request.payout_mode,
            "status": WithdrawalStatus.PENDING.value,
            "cf_transfer_id": None,
            "failure_reason": None,
            "created_at": now,
            "updated_at": now
        }
        
        await db.withdrawals.insert_one(withdrawal_doc)
        
        # Update collection's withdrawn amount (pending)
        await db.collections.update_one(
            {"id": request.collection_id},
            {"$inc": {"withdrawn_amount": request.amount}}
        )
        
        logger.info(f"Withdrawal requested: {withdrawal_id} for ₹{request.amount}")
        
        # TODO: Process payout via Cashfree Payouts API when keys are available
        # For now, mark as processing (admin will manually process or API will handle)
        
        return WithdrawalResponse(**withdrawal_doc)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting withdrawal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/withdrawals", response_model=List[WithdrawalResponse])
async def get_my_withdrawals(current_user: dict = Depends(get_required_user)):
    """Get user's withdrawal history"""
    try:
        cursor = db.withdrawals.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1)
        withdrawals = await cursor.to_list(100)
        return [WithdrawalResponse(**w) for w in withdrawals]
    except Exception as e:
        logger.error(f"Error fetching withdrawals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ADMIN ENDPOINTS ====================
@api_router.post("/admin/login", response_model=TokenResponse)
async def admin_login(credentials: UserLogin):
    """Admin login"""
    try:
        if credentials.email.lower() != ADMIN_EMAIL.lower():
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        # Check if admin user exists
        admin_user = await db.users.find_one({"email": ADMIN_EMAIL.lower(), "is_admin": True})
        
        if not admin_user:
            # Create admin user on first login
            admin_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            admin_user = {
                "id": admin_id,
                "name": "Admin",
                "email": ADMIN_EMAIL.lower(),
                "password": get_password_hash(ADMIN_PASSWORD),
                "phone": None,
                "is_admin": True,
                "kyc_status": KYCStatus.APPROVED.value,
                "created_at": now,
                "updated_at": now
            }
            await db.users.insert_one(admin_user)
        
        # Verify password
        if not verify_password(credentials.password, admin_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        access_token = create_access_token(data={"sub": admin_user["id"]})
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse(
                id=admin_user["id"],
                name=admin_user["name"],
                email=admin_user["email"],
                phone=admin_user.get("phone"),
                created_at=admin_user["created_at"],
                kyc_status=admin_user.get("kyc_status", "approved"),
                is_admin=True
            )
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/kyc-requests")
async def get_kyc_requests(
    status: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    """Get all KYC requests (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        cursor = db.kyc.find(query, {"_id": 0}).sort("created_at", -1)
        kyc_list = await cursor.to_list(100)
        
        # Get user details for each KYC
        result = []
        for kyc in kyc_list:
            user = await db.users.find_one({"id": kyc["user_id"]}, {"_id": 0, "password": 0})
            result.append({
                **kyc,
                "user_name": user["name"] if user else "Unknown",
                "user_email": user["email"] if user else "Unknown"
            })
        
        return result
    except Exception as e:
        logger.error(f"Error fetching KYC requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/kyc/{kyc_id}/review")
async def review_kyc(
    kyc_id: str,
    review: KYCReview,
    admin_user: dict = Depends(get_admin_user)
):
    """Approve or reject KYC (admin only)"""
    try:
        kyc = await db.kyc.find_one({"id": kyc_id}, {"_id": 0})
        if not kyc:
            raise HTTPException(status_code=404, detail="KYC not found")
        
        if review.status not in ["approved", "rejected"]:
            raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
        
        if review.status == "rejected" and not review.rejection_reason:
            raise HTTPException(status_code=400, detail="Rejection reason required")
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update KYC status
        await db.kyc.update_one(
            {"id": kyc_id},
            {
                "$set": {
                    "status": review.status,
                    "rejection_reason": review.rejection_reason if review.status == "rejected" else None,
                    "reviewed_by": admin_user["id"],
                    "reviewed_at": now,
                    "updated_at": now
                }
            }
        )
        
        # Update user's KYC status
        await db.users.update_one(
            {"id": kyc["user_id"]},
            {"$set": {"kyc_status": review.status}}
        )
        
        logger.info(f"KYC {kyc_id} {review.status} by admin {admin_user['id']}")
        
        return {"status": "success", "message": f"KYC {review.status}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing KYC: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/settings")
async def get_platform_settings(admin_user: dict = Depends(get_admin_user)):
    """Get platform settings (admin only)"""
    try:
        settings = await db.settings.find_one({"key": "platform"}, {"_id": 0})
        if not settings:
            return {"platform_fee_percentage": 2.5}
        return {"platform_fee_percentage": settings.get("platform_fee_percentage", 2.5)}
    except Exception as e:
        logger.error(f"Error fetching settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/settings")
async def update_platform_settings(
    settings: PlatformSettings,
    admin_user: dict = Depends(get_admin_user)
):
    """Update platform settings (admin only)"""
    try:
        if settings.platform_fee_percentage < 0 or settings.platform_fee_percentage > 100:
            raise HTTPException(status_code=400, detail="Fee percentage must be between 0 and 100")
        
        await db.settings.update_one(
            {"key": "platform"},
            {
                "$set": {
                    "platform_fee_percentage": settings.platform_fee_percentage,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_by": admin_user["id"]
                }
            },
            upsert=True
        )
        
        logger.info(f"Platform fee updated to {settings.platform_fee_percentage}% by admin {admin_user['id']}")
        
        return {"status": "success", "platform_fee_percentage": settings.platform_fee_percentage}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(
    status: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    """Get all withdrawal requests (admin only)"""
    try:
        query = {}
        if status:
            query["status"] = status
        
        cursor = db.withdrawals.find(query, {"_id": 0}).sort("created_at", -1)
        withdrawals = await cursor.to_list(100)
        
        # Enrich with user and collection details
        result = []
        for w in withdrawals:
            user = await db.users.find_one({"id": w["user_id"]}, {"_id": 0, "password": 0})
            collection = await db.collections.find_one({"id": w["collection_id"]}, {"_id": 0})
            kyc = await db.kyc.find_one({"user_id": w["user_id"]}, {"_id": 0})
            
            result.append({
                **w,
                "user_name": user["name"] if user else "Unknown",
                "user_email": user["email"] if user else "Unknown",
                "collection_title": collection["title"] if collection else "Unknown",
                "payout_details": {
                    "bank_account": kyc["bank_account_number"][-4:] if kyc and kyc.get("bank_account_number") else None,
                    "bank_ifsc": kyc.get("bank_ifsc") if kyc else None,
                    "upi_id": kyc.get("upi_id") if kyc else None
                } if kyc else None
            })
        
        return result
    except Exception as e:
        logger.error(f"Error fetching withdrawals: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/withdrawals/{withdrawal_id}/process")
async def process_withdrawal(
    withdrawal_id: str,
    action: str = Query(..., regex="^(complete|fail)$"),
    failure_reason: Optional[str] = None,
    admin_user: dict = Depends(get_admin_user)
):
    """Process withdrawal - mark as completed or failed (admin only)"""
    try:
        withdrawal = await db.withdrawals.find_one({"id": withdrawal_id}, {"_id": 0})
        if not withdrawal:
            raise HTTPException(status_code=404, detail="Withdrawal not found")
        
        if withdrawal["status"] not in [WithdrawalStatus.PENDING.value, WithdrawalStatus.PROCESSING.value]:
            raise HTTPException(status_code=400, detail="Withdrawal already processed")
        
        now = datetime.now(timezone.utc).isoformat()
        
        if action == "complete":
            new_status = WithdrawalStatus.COMPLETED.value
            failure_reason = None
        else:
            new_status = WithdrawalStatus.FAILED.value
            if not failure_reason:
                failure_reason = "Payment failed"
            
            # Refund the withdrawn amount back to collection
            await db.collections.update_one(
                {"id": withdrawal["collection_id"]},
                {"$inc": {"withdrawn_amount": -withdrawal["amount"]}}
            )
        
        await db.withdrawals.update_one(
            {"id": withdrawal_id},
            {
                "$set": {
                    "status": new_status,
                    "failure_reason": failure_reason,
                    "processed_by": admin_user["id"],
                    "processed_at": now,
                    "updated_at": now
                }
            }
        )
        
        logger.info(f"Withdrawal {withdrawal_id} {action}d by admin {admin_user['id']}")
        
        return {"status": "success", "message": f"Withdrawal {action}d"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing withdrawal: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin_user: dict = Depends(get_admin_user)):
    """Get admin dashboard stats"""
    try:
        # Total users
        total_users = await db.users.count_documents({"is_admin": {"$ne": True}})
        
        # KYC stats
        pending_kyc = await db.kyc.count_documents({"status": KYCStatus.PENDING.value})
        approved_kyc = await db.kyc.count_documents({"status": KYCStatus.APPROVED.value})
        
        # Withdrawal stats
        pending_withdrawals = await db.withdrawals.count_documents({"status": WithdrawalStatus.PENDING.value})
        
        # Total amounts
        pipeline = [
            {"$match": {"status": WithdrawalStatus.COMPLETED.value}},
            {"$group": {"_id": None, "total": {"$sum": "$net_amount"}, "fees": {"$sum": "$platform_fee"}}}
        ]
        withdrawal_stats = await db.withdrawals.aggregate(pipeline).to_list(1)
        total_withdrawn = withdrawal_stats[0]["total"] if withdrawal_stats else 0
        total_fees = withdrawal_stats[0]["fees"] if withdrawal_stats else 0
        
        # Get current settings
        settings = await db.settings.find_one({"key": "platform"}, {"_id": 0})
        current_fee = settings.get("platform_fee_percentage", 2.5) if settings else 2.5
        
        return {
            "total_users": total_users,
            "pending_kyc": pending_kyc,
            "approved_kyc": approved_kyc,
            "pending_withdrawals": pending_withdrawals,
            "total_withdrawn": total_withdrawn,
            "total_platform_fees": total_fees,
            "current_fee_percentage": current_fee
        }
    except Exception as e:
        logger.error(f"Error fetching admin dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== STATS ENDPOINT ====================
@api_router.get("/stats")
async def get_platform_stats():
    """Get platform statistics"""
    try:
        total_collections = await db.collections.count_documents({"status": CollectionStatus.ACTIVE.value})
        total_donations = await db.donations.count_documents({"status": PaymentStatus.SUCCESS.value})
        
        # Aggregate total amount raised
        pipeline = [
            {"$match": {"status": PaymentStatus.SUCCESS.value}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        result = await db.donations.aggregate(pipeline).to_list(1)
        total_raised = result[0]["total"] if result else 0
        
        return {
            "total_collections": total_collections,
            "total_donations": total_donations,
            "total_raised": total_raised
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return {"total_collections": 0, "total_donations": 0, "total_raised": 0}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
