from fastapi import FastAPI, APIRouter, HTTPException, Request, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from enum import Enum
import hashlib
import hmac
import base64
import json
import aiohttp

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


# ==================== COLLECTION ENDPOINTS ====================
@api_router.get("/")
async def root():
    return {"message": "FundFlow API - Group Collection Platform"}

@api_router.post("/collections", response_model=CollectionResponse)
async def create_collection(collection: CollectionCreate):
    """Create a new collection/activity"""
    try:
        collection_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": collection_id,
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
        
        # Create customer details for Cashfree
        customer_details = CustomerDetails(
            customer_id=f"donor_{uuid.uuid4().hex[:8]}",
            customer_name=payment.donor_name,
            customer_email=payment.donor_email,
            customer_phone=payment.donor_phone
        )
        
        # Create order meta with return URL
        base_url = os.environ.get('API_BASE_URL', 'http://localhost:3000')
        order_meta = OrderMeta(
            return_url=f"{base_url}/payment/callback?order_id={order_id}",
            notify_url=f"{os.environ.get('WEBHOOK_URL', base_url)}/api/webhooks/payment"
        )
        
        # Create order request
        create_order_request = CreateOrderRequest(
            order_id=order_id,
            order_amount=payment.amount,
            order_currency="INR",
            customer_details=customer_details,
            order_meta=order_meta
        )
        
        # Call Cashfree API
        api_version = "2023-08-01"
        cashfree_api = Cashfree()
        response = cashfree_api.PGCreateOrder(api_version, create_order_request, None, None)
        
        if not response or not response.data:
            logger.error(f"Cashfree order creation failed")
            raise HTTPException(status_code=400, detail="Failed to create payment order")
        
        cf_order = response.data
        
        # Store donation record (pending)
        donation_doc = {
            "id": str(uuid.uuid4()),
            "collection_id": payment.collection_id,
            "order_id": order_id,
            "cf_order_id": cf_order.cf_order_id,
            "donor_name": payment.donor_name,
            "donor_email": payment.donor_email,
            "donor_phone": payment.donor_phone,
            "amount": payment.amount,
            "message": payment.message,
            "anonymous": payment.anonymous,
            "status": PaymentStatus.PENDING.value,
            "payment_session_id": cf_order.payment_session_id,
            "created_at": now,
            "updated_at": now
        }
        
        await db.donations.insert_one(donation_doc)
        logger.info(f"Payment order created: {order_id} for collection {payment.collection_id}")
        
        return PaymentOrderResponse(
            order_id=order_id,
            cf_order_id=cf_order.cf_order_id,
            payment_session_id=cf_order.payment_session_id,
            order_status=cf_order.order_status
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
        
        # Call Cashfree to verify order status
        api_version = "2023-08-01"
        cashfree_api = Cashfree()
        response = cashfree_api.PGFetchOrder(api_version, order_id, None, None)
        
        if not response or not response.data:
            return {"status": donation.get("status"), "message": "Unable to verify with payment gateway"}
        
        cf_order = response.data
        order_status = cf_order.order_status
        
        # Update local record if status changed
        new_status = donation.get("status")
        if order_status == "PAID":
            new_status = PaymentStatus.SUCCESS.value
        elif order_status in ["EXPIRED", "CANCELLED"]:
            new_status = PaymentStatus.FAILED.value
        
        if new_status != donation.get("status"):
            await db.donations.update_one(
                {"order_id": order_id},
                {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # If payment successful, update collection amount
            if new_status == PaymentStatus.SUCCESS.value:
                await db.collections.update_one(
                    {"id": donation["collection_id"]},
                    {
                        "$inc": {"current_amount": donation["amount"], "donor_count": 1},
                        "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
                    }
                )
                logger.info(f"Payment successful for order {order_id}")
        
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
        
        now = datetime.now(timezone.utc).isoformat()
        
        if event_type == "PAYMENT_SUCCESS_WEBHOOK":
            # Update donation status
            await db.donations.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "status": PaymentStatus.SUCCESS.value,
                        "cf_payment_id": payment_info.get("cf_payment_id"),
                        "payment_method": payment_info.get("payment_method"),
                        "updated_at": now
                    }
                }
            )
            
            # Update collection amount
            await db.collections.update_one(
                {"id": donation["collection_id"]},
                {
                    "$inc": {"current_amount": donation["amount"], "donor_count": 1},
                    "$set": {"updated_at": now}
                }
            )
            
            logger.info(f"Payment webhook: SUCCESS for order {order_id}")
            
        elif event_type == "PAYMENT_FAILED_WEBHOOK":
            await db.donations.update_one(
                {"order_id": order_id},
                {"$set": {"status": PaymentStatus.FAILED.value, "updated_at": now}}
            )
            logger.info(f"Payment webhook: FAILED for order {order_id}")
        
        return {"status": "processed"}
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


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
