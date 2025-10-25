from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, File, UploadFile, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))

# Stripe setup
stripe_api_key = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI(title="Marketplace API")
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str = ""
    full_name: str = ""
    phone: str = ""
    address: str = ""
    city: str = ""
    postal_code: str = ""
    country: str = ""
    verified: bool = False
    verification_token: str = ""
    role: str = "customer"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    address: str
    city: str
    postal_code: str
    country: str
    verified: bool
    role: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    price: float
    images: List[str] = []
    category: str
    stock: int = 0
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    description: str = ""
    image: str = ""

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float
    title: str
    image: str

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1

class UpdateCartItemRequest(BaseModel):
    product_id: str
    quantity: int

class ShippingAddress(BaseModel):
    full_name: str
    address: str
    city: str
    postal_code: str
    country: str
    phone: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem]
    total_amount: float
    payment_method: str
    payment_status: str = "pending"
    shipping_address: ShippingAddress
    status: str = "pending"
    session_id: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CreateOrderRequest(BaseModel):
    payment_method: str
    shipping_address: ShippingAddress

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    session_id: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    payment_method: str
    user_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        verification_token=str(uuid.uuid4()),
        verified=True  # Auto-verify for demo
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {
        "message": "Registration successful",
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            address=user.address,
            city=user.city,
            postal_code=user.postal_code,
            country=user.country,
            verified=user.verified,
            role=user.role
        )
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id, "email": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone=user.phone,
            address=user.address,
            city=user.city,
            postal_code=user.postal_code,
            country=user.country,
            verified=user.verified,
            role=user.role
        )
    }

@api_router.get("/auth/me", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        address=current_user.address,
        city=current_user.city,
        postal_code=current_user.postal_code,
        country=current_user.country,
        verified=current_user.verified,
        role=current_user.role
    )

@api_router.put("/auth/profile")
async def update_profile(update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": current_user.id}, {"$set": update_dict})
    return {"message": "Profile updated successfully"}

# Product endpoints
@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, search: Optional[str] = None, limit: int = 50):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    for p in products:
        if isinstance(p.get('created_at'), str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return Product(**product)

# Categories
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

# Cart endpoints
@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart_doc:
        cart = Cart(user_id=current_user.id, items=[])
        cart_dict = cart.model_dump()
        cart_dict['updated_at'] = cart_dict['updated_at'].isoformat()
        await db.carts.insert_one(cart_dict)
        return cart
    if isinstance(cart_doc.get('updated_at'), str):
        cart_doc['updated_at'] = datetime.fromisoformat(cart_doc['updated_at'])
    return Cart(**cart_doc)

@api_router.post("/cart/add")
async def add_to_cart(request: AddToCartRequest, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"id": request.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    cart_doc = await db.carts.find_one({"user_id": current_user.id}, {"_id": 0})
    if not cart_doc:
        cart = Cart(user_id=current_user.id, items=[])
        cart_doc = cart.model_dump()
        cart_doc['updated_at'] = cart_doc['updated_at'].isoformat()
        await db.carts.insert_one(cart_doc)
    
    items = cart_doc.get('items', [])
    existing_item = next((item for item in items if item['product_id'] == request.product_id), None)
    
    if existing_item:
        existing_item['quantity'] += request.quantity
    else:
        items.append({
            "product_id": product['id'],
            "quantity": request.quantity,
            "price": product['price'],
            "title": product['title'],
            "image": product['images'][0] if product.get('images') else ""
        })
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(request: UpdateCartItemRequest, current_user: User = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": current_user.id})
    if not cart_doc:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart_doc.get('items', [])
    item = next((item for item in items if item['product_id'] == request.product_id), None)
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    if request.quantity <= 0:
        items = [item for item in items if item['product_id'] != request.product_id]
    else:
        item['quantity'] = request.quantity
    
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, current_user: User = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user.id},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Item removed from cart"}

# Order endpoints
@api_router.post("/orders")
async def create_order(request: CreateOrderRequest, current_user: User = Depends(get_current_user)):
    cart_doc = await db.carts.find_one({"user_id": current_user.id})
    if not cart_doc or not cart_doc.get('items'):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = cart_doc.get('items', [])
    total = sum(item['price'] * item['quantity'] for item in items)
    
    order = Order(
        user_id=current_user.id,
        items=[CartItem(**item) for item in items],
        total_amount=total,
        payment_method=request.payment_method,
        shipping_address=request.shipping_address
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    await db.orders.insert_one(order_dict)
    
    return {
        "order_id": order.id,
        "total_amount": total,
        "payment_method": request.payment_method
    }

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user.id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order.get('created_at'), str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return Order(**order)

@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders

# Payment endpoints
@api_router.post("/payment/create-session")
async def create_payment_session(
    order_id: str,
    origin_url: str,
    current_user: User = Depends(get_current_user)
):
    order_doc = await db.orders.find_one({"id": order_id, "user_id": current_user.id})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    payment_method = order_doc.get('payment_method')
    total_amount = order_doc.get('total_amount')
    
    if payment_method == 'stripe':
        webhook_url = f"{origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        success_url = f"{origin_url}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/checkout"
        
        checkout_request = CheckoutSessionRequest(
            amount=float(total_amount),
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"order_id": order_id, "user_id": current_user.id}
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        transaction = PaymentTransaction(
            order_id=order_id,
            session_id=session.session_id,
            amount=total_amount,
            payment_method="stripe",
            user_id=current_user.id
        )
        transaction_dict = transaction.model_dump()
        transaction_dict['created_at'] = transaction_dict['created_at'].isoformat()
        await db.payment_transactions.insert_one(transaction_dict)
        
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"session_id": session.session_id}}
        )
        
        return {"url": session.url, "session_id": session.session_id}
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported payment method")

@api_router.get("/payment/status/{session_id}")
async def check_payment_status(session_id: str, current_user: User = Depends(get_current_user)):
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": current_user.id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.get('payment_status') == 'paid':
        return {
            "status": "completed",
            "payment_status": "paid",
            "order_id": transaction.get('order_id')
        }
    
    webhook_url = "http://localhost:8001/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": checkout_status.payment_status}}
        )
        
        if checkout_status.payment_status == "paid":
            await db.orders.update_one(
                {"id": transaction.get('order_id')},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
            
            await db.carts.update_one(
                {"user_id": current_user.id},
                {"$set": {"items": []}}
            )
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount": checkout_status.amount_total / 100,
            "order_id": transaction.get('order_id')
        }
    except Exception as e:
        logging.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    webhook_url = str(request.base_url) + "api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            metadata = webhook_response.metadata
            order_id = metadata.get('order_id')
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"payment_status": "paid", "status": "confirmed"}}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook verification failed")

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
