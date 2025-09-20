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