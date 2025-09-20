from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security setup
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# User Models
class UserRole(str):
    CUSTOMER = "customer"
    SALESPERSON = "salesperson"
    SALES_MANAGER = "sales_manager"
    OPERATIONS = "operations"
    ADMIN = "admin"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
    department: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TravelRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    customer_id: str
    customer_name: str
    travel_type: str
    travelers_count: int
    adults: int
    children: int
    infants: int
    departure_date: str
    return_date: str
    is_flexible_dates: bool = False
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_per_person: bool = False
    destinations: List[str]
    transport_modes: List[str]
    accommodation_star: Optional[int] = None
    meal_preference: Optional[str] = None
    special_requirements: Optional[str] = None
    status: str = "pending"  # pending, quoted, confirmed, cancelled
    assigned_salesperson: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Quotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    request_id: str
    salesperson_id: str
    salesperson_name: str
    title: str
    options: List[dict]  # Multiple quotation options A, B, C
    total_price: float
    margin: float
    validity_days: int = 7
    status: str = "draft"  # draft, sent, approved, rejected, accepted
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quotation_id: str
    customer_id: str
    customer_name: str
    total_amount: float
    payment_status: str = "pending"  # pending, partial, paid, refunded
    booking_status: str = "confirmed"  # confirmed, cancelled, completed
    travel_date: str
    operation_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Initialize mock data
async def init_mock_data():
    # Check if users already exist
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        return
    
    # Mock users for each role
    mock_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "customer@demo.com",
            "password": get_password_hash("demo123"),
            "name": "John Customer",
            "role": "customer",
            "phone": "+91-9876543210",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "sales@demo.com", 
            "password": get_password_hash("demo123"),
            "name": "Sarah Sales",
            "role": "salesperson",
            "department": "Sales",
            "phone": "+91-9876543211",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "manager@demo.com",
            "password": get_password_hash("demo123"),
            "name": "Mike Manager",
            "role": "sales_manager",
            "department": "Sales",
            "phone": "+91-9876543212",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "ops@demo.com",
            "password": get_password_hash("demo123"),
            "name": "Olivia Operations",
            "role": "operations",
            "department": "Operations",
            "phone": "+91-9876543213",
            "created_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "email": "admin@demo.com",
            "password": get_password_hash("demo123"),
            "name": "Alex Admin",
            "role": "admin",
            "department": "IT",
            "phone": "+91-9876543214",
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.users.insert_many(mock_users)
    
    # Mock travel requests
    mock_requests = [
        {
            "id": str(uuid.uuid4()),
            "title": "Family Trip to Goa",
            "customer_id": mock_users[0]["id"],
            "customer_name": "John Customer",
            "travel_type": "leisure",
            "travelers_count": 4,
            "adults": 2,
            "children": 2,
            "infants": 0,
            "departure_date": "2024-12-15",
            "return_date": "2024-12-22",
            "is_flexible_dates": False,
            "budget_min": 80000,
            "budget_max": 120000,
            "budget_per_person": False,
            "destinations": ["Goa", "Beach"],
            "transport_modes": ["Flight", "Car"],
            "accommodation_star": 4,
            "meal_preference": "Vegetarian",
            "special_requirements": "Kid-friendly resort with pool",
            "status": "pending",
            "assigned_salesperson": mock_users[1]["id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Corporate Retreat - Manali",
            "customer_id": mock_users[0]["id"],
            "customer_name": "John Customer",
            "travel_type": "business",
            "travelers_count": 12,
            "adults": 12,
            "children": 0,
            "infants": 0,
            "departure_date": "2024-11-20",
            "return_date": "2024-11-23",
            "is_flexible_dates": True,
            "budget_min": 200000,
            "budget_max": 300000,
            "budget_per_person": True,
            "destinations": ["Manali", "Mountains"],
            "transport_modes": ["Bus", "Flight"],
            "accommodation_star": 3,
            "meal_preference": "Mixed",
            "special_requirements": "Conference hall required",
            "status": "quoted",
            "assigned_salesperson": mock_users[1]["id"],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.travel_requests.insert_many(mock_requests)
    
    # Mock quotations
    mock_quotations = [
        {
            "id": str(uuid.uuid4()),
            "request_id": mock_requests[1]["id"],
            "salesperson_id": mock_users[1]["id"],
            "salesperson_name": "Sarah Sales",
            "title": "Corporate Retreat Package - Manali",
            "options": [
                {
                    "name": "Option A - Premium",
                    "price": 280000,
                    "duration": "3 Days 2 Nights",
                    "hotel": "The Himalayan Resort (4 Star)",
                    "transport": "Volvo Bus + Local Transport",
                    "activities": ["Team Building", "Adventure Sports", "Cultural Show"],
                    "meals": "All Meals Included"
                },
                {
                    "name": "Option B - Standard",
                    "price": 220000,
                    "duration": "3 Days 2 Nights", 
                    "hotel": "Pine Valley Resort (3 Star)",
                    "transport": "Standard Bus + Local Transport",
                    "activities": ["Team Building", "Sightseeing"],
                    "meals": "Breakfast & Dinner"
                }
            ],
            "total_price": 280000,
            "margin": 15.5,
            "validity_days": 7,
            "status": "sent",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.quotations.insert_many(mock_quotations)
    
    # Mock bookings
    mock_bookings = [
        {
            "id": str(uuid.uuid4()),
            "quotation_id": mock_quotations[0]["id"],
            "customer_id": mock_users[0]["id"],
            "customer_name": "John Customer",
            "total_amount": 280000,
            "payment_status": "partial",
            "booking_status": "confirmed",
            "travel_date": "2024-11-20",
            "operation_notes": "Advance payment received. Hotel confirmed.",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    await db.bookings.insert_many(mock_bookings)

# Authentication endpoints
@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**user)
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Travel Request endpoints
@api_router.get("/requests", response_model=List[TravelRequest])
async def get_travel_requests(current_user: User = Depends(get_current_user)):
    if current_user.role == "customer":
        requests = await db.travel_requests.find({"customer_id": current_user.id}).to_list(1000)
    elif current_user.role in ["salesperson", "sales_manager"]:
        requests = await db.travel_requests.find().to_list(1000)
    elif current_user.role in ["operations", "admin"]:
        requests = await db.travel_requests.find().to_list(1000)
    else:
        requests = []
    
    return [TravelRequest(**request) for request in requests]

@api_router.post("/requests", response_model=TravelRequest)
async def create_travel_request(request_data: dict, current_user: User = Depends(get_current_user)):
    request_data["customer_id"] = current_user.id
    request_data["customer_name"] = current_user.name
    request_obj = TravelRequest(**request_data)
    await db.travel_requests.insert_one(request_obj.dict())
    return request_obj

# Quotation endpoints
@api_router.get("/quotations", response_model=List[Quotation])
async def get_quotations(current_user: User = Depends(get_current_user)):
    if current_user.role == "customer":
        # Get quotations for customer's requests
        customer_requests = await db.travel_requests.find({"customer_id": current_user.id}).to_list(1000)
        request_ids = [req["id"] for req in customer_requests]
        quotations = await db.quotations.find({"request_id": {"$in": request_ids}}).to_list(1000)
    else:
        quotations = await db.quotations.find().to_list(1000)
    
    return [Quotation(**quotation) for quotation in quotations]

# Booking endpoints
@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(current_user: User = Depends(get_current_user)):
    if current_user.role == "customer":
        bookings = await db.bookings.find({"customer_id": current_user.id}).to_list(1000)
    else:
        bookings = await db.bookings.find().to_list(1000)
    
    return [Booking(**booking) for booking in bookings]

# Dashboard stats endpoints
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    stats = {}
    
    if current_user.role == "customer":
        stats = {
            "active_requests": await db.travel_requests.count_documents({"customer_id": current_user.id, "status": {"$in": ["pending", "quoted"]}}),
            "total_bookings": await db.bookings.count_documents({"customer_id": current_user.id}),
            "pending_payments": await db.bookings.count_documents({"customer_id": current_user.id, "payment_status": {"$in": ["pending", "partial"]}})
        }
    elif current_user.role == "salesperson":
        stats = {
            "assigned_requests": await db.travel_requests.count_documents({"assigned_salesperson": current_user.id}),
            "pending_quotations": await db.quotations.count_documents({"salesperson_id": current_user.id, "status": "draft"}),
            "conversion_rate": 75.5,  # Mock data
            "avg_response_time": "4.2 hours"  # Mock data
        }
    elif current_user.role == "sales_manager":
        stats = {
            "team_performance": 85.2,  # Mock data
            "pending_approvals": await db.quotations.count_documents({"status": "pending_approval"}),
            "monthly_revenue": 2500000,  # Mock data
            "team_size": 8  # Mock data
        }
    elif current_user.role == "operations":
        stats = {
            "confirmed_bookings": await db.bookings.count_documents({"booking_status": "confirmed"}),
            "pending_payments": await db.bookings.count_documents({"payment_status": {"$in": ["pending", "partial"]}}),
            "upcoming_trips": 15,  # Mock data
            "customer_satisfaction": 4.8  # Mock data
        }
    elif current_user.role == "admin":
        stats = {
            "total_users": await db.users.count_documents({}),
            "total_requests": await db.travel_requests.count_documents({}),
            "total_quotations": await db.quotations.count_documents({}),
            "system_health": "Excellent"  # Mock data
        }
    
    return stats

# Rate Optimization Models
class RateRecommendation(BaseModel):
    request_id: str
    recommended_price: float
    confidence: float
    reasoning: str
    seasonal_factor: float = 1.0
    competitor_delta: float = 0.0
    demand_factor: float = 1.0

class ScenarioSimulation(BaseModel):
    base_price: float
    hotel_star: int = 3
    transport_class: str = "economy"
    duration_days: int = 3
    estimated_conversion: float = 0.75

class ApprovalRequest(BaseModel):
    quotation_id: str
    discount_percentage: float
    reason: str
    requested_by: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    status: str = "pending"  # pending, completed, failed, refunded
    gateway_response: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Rate Optimization Engine Endpoints
@api_router.get("/rate-optimization/recommendations/{request_id}")
async def get_rate_recommendations(
    request_id: str, 
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered rate recommendations for a travel request"""
    
    # Mock rate recommendation logic
    request = await db.travel_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Simulate dynamic pricing based on request parameters
    base_price = request.get("budget_max", 100000)
    seasonal_factor = 1.2 if "12" in request.get("departure_date", "") else 1.0
    demand_factor = 1.1 if request.get("is_flexible_dates", False) else 1.0
    competitor_delta = 0.05  # 5% below competitor
    
    recommended_price = base_price * seasonal_factor * demand_factor * (1 - competitor_delta)
    confidence = 0.85 if request.get("travel_type") == "business" else 0.75
    
    reasoning = f"Peak season: {seasonal_factor > 1.0}, Flexible dates: {request.get('is_flexible_dates', False)}, Business travel: {request.get('travel_type') == 'business'}"
    
    return RateRecommendation(
        request_id=request_id,
        recommended_price=round(recommended_price, 2),
        confidence=confidence,
        reasoning=reasoning,
        seasonal_factor=seasonal_factor,
        competitor_delta=competitor_delta,
        demand_factor=demand_factor
    )

@api_router.post("/rate-optimization/simulate")
async def simulate_pricing_scenario(
    scenario: ScenarioSimulation,
    current_user: User = Depends(get_current_user)
):
    """Simulate pricing for different scenarios"""
    
    # Base price multipliers
    star_multipliers = {3: 1.0, 4: 1.4, 5: 2.0}
    transport_multipliers = {"economy": 1.0, "premium": 1.3, "private": 1.8}
    
    adjusted_price = (
        scenario.base_price * 
        star_multipliers.get(scenario.hotel_star, 1.0) * 
        transport_multipliers.get(scenario.transport_class, 1.0) * 
        (scenario.duration_days / 3.0)  # 3 days baseline
    )
    
    # Estimate conversion probability (inverse relationship with price)
    conversion_rate = max(0.2, 0.95 - (adjusted_price / scenario.base_price - 1) * 0.5)
    
    return {
        "adjusted_price": round(adjusted_price, 2),
        "estimated_conversion": round(conversion_rate, 2),
        "price_change_percentage": round((adjusted_price / scenario.base_price - 1) * 100, 1),
        "margin_impact": round((adjusted_price - scenario.base_price) * 0.15, 2)  # 15% margin
    }

@api_router.get("/rate-optimization/competitor-rates/{destination}")
async def get_competitor_rates(
    destination: str,
    current_user: User = Depends(get_current_user)
):
    """Get competitor rate information for a destination"""
    
    # Mock competitor data
    competitors = [
        {"name": "TravelPro", "rate": 95000, "confidence": "high"},
        {"name": "BusinessTravel Inc", "rate": 105000, "confidence": "medium"},
        {"name": "CorporateJourneys", "rate": 88000, "confidence": "high"}
    ]
    
    return {
        "destination": destination,
        "competitors": competitors,
        "market_average": 96000,
        "suggested_action": "Price competitively at ₹92,000 to win while maintaining margin"
    }

# Advanced Quotation Management
@api_router.post("/quotations/{quotation_id}/versions")
async def create_quotation_version(
    quotation_id: str,
    version_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Create a new version of a quotation"""
    
    original = await db.quotations.find_one({"id": quotation_id})
    if not original:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Create new version
    new_version = Quotation(
        request_id=original["request_id"],
        salesperson_id=current_user.id,
        salesperson_name=current_user.name,
        title=f"{original['title']} (v{len(original.get('versions', [])) + 2})",
        options=version_data.get("options", original["options"]),
        total_price=version_data.get("total_price", original["total_price"]),
        margin=version_data.get("margin", original["margin"]),
        validity_days=version_data.get("validity_days", 7),
        status="draft"
    )
    
    # Store version history
    await db.quotation_versions.insert_one({
        "quotation_id": quotation_id,
        "version": len(original.get("versions", [])) + 2,
        "data": new_version.dict(),
        "created_by": current_user.id,
        "created_at": datetime.now(timezone.utc)
    })
    
    return new_version

@api_router.post("/quotations/{quotation_id}/approval")
async def request_quotation_approval(
    quotation_id: str,
    approval_request: ApprovalRequest,
    current_user: User = Depends(get_current_user)
):
    """Request manager approval for quotation discount"""
    
    quotation = await db.quotations.find_one({"id": quotation_id})
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    
    # Store approval request
    approval_data = {
        "id": str(uuid.uuid4()),
        "quotation_id": quotation_id,
        "discount_percentage": approval_request.discount_percentage,
        "reason": approval_request.reason,
        "requested_by": current_user.id,
        "requested_by_name": current_user.name,
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.approval_requests.insert_one(approval_data)
    
    # Update quotation status
    await db.quotations.update_one(
        {"id": quotation_id},
        {"$set": {"status": "pending_approval", "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Approval request submitted", "approval_id": approval_data["id"]}

@api_router.get("/approvals/pending")
async def get_pending_approvals(current_user: User = Depends(get_current_user)):
    """Get pending approval requests for managers"""
    
    if current_user.role not in ["sales_manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    approvals = await db.approval_requests.find({"status": "pending"}).to_list(100)
    return approvals

@api_router.post("/approvals/{approval_id}/decision")
async def make_approval_decision(
    approval_id: str,
    decision: dict,
    current_user: User = Depends(get_current_user)
):
    """Approve or reject a quotation approval request"""
    
    if current_user.role not in ["sales_manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    approval = await db.approval_requests.find_one({"id": approval_id})
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    # Update approval status
    await db.approval_requests.update_one(
        {"id": approval_id},
        {
            "$set": {
                "status": decision["decision"],  # "approved" or "rejected"
                "manager_comment": decision.get("comment", ""),
                "decided_by": current_user.id,
                "decided_by_name": current_user.name,
                "decided_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update quotation status
    quotation_status = "approved" if decision["decision"] == "approved" else "draft"
    await db.quotations.update_one(
        {"id": approval["quotation_id"]},
        {"$set": {"status": quotation_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": f"Approval request {decision['decision']}"}

# Payment Processing Endpoints
@api_router.post("/payments/capture")
async def capture_payment(
    payment_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Capture payment for a booking"""
    
    if current_user.role not in ["operations", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    booking = await db.bookings.find_one({"id": payment_data["booking_id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Create payment transaction
    transaction = PaymentTransaction(
        booking_id=payment_data["booking_id"],
        amount=payment_data["amount"],
        payment_method=payment_data.get("payment_method", "card"),
        transaction_id=f"TXN-{str(uuid.uuid4())[:8].upper()}",
        status="completed"  # Mock successful payment
    )
    
    await db.payment_transactions.insert_one(transaction.dict())
    
    # Update booking payment status
    total_paid = booking.get("amount_paid", 0) + payment_data["amount"]
    payment_status = "paid" if total_paid >= booking["total_amount"] else "partial"
    
    await db.bookings.update_one(
        {"id": payment_data["booking_id"]},
        {
            "$set": {
                "payment_status": payment_status,
                "amount_paid": total_paid,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "transaction_id": transaction.transaction_id,
        "status": "success",
        "amount_paid": total_paid,
        "remaining_amount": max(0, booking["total_amount"] - total_paid)
    }

@api_router.get("/payments/transactions/{booking_id}")
async def get_payment_transactions(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all payment transactions for a booking"""
    
    transactions = await db.payment_transactions.find({"booking_id": booking_id}).to_list(100)
    return transactions

@api_router.post("/payments/refund")
async def process_refund(
    refund_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Process refund for a booking"""
    
    if current_user.role not in ["operations", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create refund transaction
    refund_transaction = PaymentTransaction(
        booking_id=refund_data["booking_id"],
        amount=-abs(refund_data["amount"]),  # Negative for refund
        payment_method="refund",
        transaction_id=f"REF-{str(uuid.uuid4())[:8].upper()}",
        status="completed"
    )
    
    await db.payment_transactions.insert_one(refund_transaction.dict())
    
    return {
        "refund_id": refund_transaction.transaction_id,
        "status": "success",
        "refund_amount": refund_data["amount"]
    }

# Enhanced Analytics Endpoints
@api_router.get("/analytics/conversion-rates")
async def get_conversion_analytics(current_user: User = Depends(get_current_user)):
    """Get conversion rate analytics"""
    
    if current_user.role not in ["sales_manager", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mock analytics data
    return {
        "overall_conversion": 0.742,
        "by_destination": {
            "Goa": 0.823,
            "Manali": 0.687,
            "Kerala": 0.756,
            "Rajasthan": 0.634
        },
        "by_salesperson": {
            "Sarah Sales": 0.834,
            "John Doe": 0.723,
            "Mike Smith": 0.692
        },
        "trend_data": [
            {"month": "Jan", "rate": 0.72},
            {"month": "Feb", "rate": 0.68},
            {"month": "Mar", "rate": 0.74},
            {"month": "Apr", "rate": 0.78}
        ]
    }

@api_router.get("/analytics/pricing-optimization")
async def get_pricing_analytics(current_user: User = Depends(get_current_user)):
    """Get pricing optimization analytics"""
    
    return {
        "average_margin": 0.147,
        "price_acceptance_rate": 0.721,
        "optimal_price_points": {
            "budget_leisure": {"min": 45000, "max": 85000, "optimal": 62000},
            "premium_leisure": {"min": 85000, "max": 150000, "optimal": 118000},
            "business_travel": {"min": 75000, "max": 200000, "optimal": 135000}
        },
        "seasonal_multipliers": {
            "peak": 1.4,
            "high": 1.2,
            "normal": 1.0,
            "low": 0.8
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_mock_data()
    logger.info("Mock data initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()