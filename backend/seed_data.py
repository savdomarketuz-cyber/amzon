import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing data
    await db.categories.delete_many({})
    await db.products.delete_many({})
    
    # Seed categories
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": "Electronics",
            "slug": "electronics",
            "description": "Phones, laptops, and gadgets",
            "image": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Fashion",
            "slug": "fashion",
            "description": "Clothing, shoes, and accessories",
            "image": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Home & Garden",
            "slug": "home-garden",
            "description": "Furniture, decor, and tools",
            "image": "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sports",
            "slug": "sports",
            "description": "Equipment and apparel",
            "image": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Books",
            "slug": "books",
            "description": "Fiction, non-fiction, and textbooks",
            "image": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Toys & Games",
            "slug": "toys-games",
            "description": "For kids and adults",
            "image": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800"
        }
    ]
    
    await db.categories.insert_many(categories)
    
    # Seed products
    products = [
        {
            "id": str(uuid.uuid4()),
            "title": "Wireless Noise-Cancelling Headphones",
            "description": "Premium over-ear headphones with active noise cancellation and 30-hour battery life",
            "price": 299.99,
            "images": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
            "category": "Electronics",
            "stock": 45,
            "rating": 4.7,
            "reviews_count": 892,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "4K Ultra HD Smart TV 55\"",
            "description": "Crystal-clear 4K resolution with HDR support and built-in streaming apps",
            "price": 599.99,
            "images": ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800"],
            "category": "Electronics",
            "stock": 23,
            "rating": 4.6,
            "reviews_count": 445,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Smartphone 128GB",
            "description": "Latest flagship smartphone with triple camera system and all-day battery",
            "price": 899.99,
            "images": ["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"],
            "category": "Electronics",
            "stock": 67,
            "rating": 4.8,
            "reviews_count": 1230,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Laptop 15.6\" Core i7",
            "description": "Powerful laptop with 16GB RAM, 512GB SSD, perfect for work and gaming",
            "price": 1299.99,
            "images": ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800"],
            "category": "Electronics",
            "stock": 34,
            "rating": 4.5,
            "reviews_count": 678,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Wireless Gaming Mouse",
            "description": "High-precision gaming mouse with customizable RGB lighting",
            "price": 79.99,
            "images": ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=800"],
            "category": "Electronics",
            "stock": 120,
            "rating": 4.4,
            "reviews_count": 324,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Men's Leather Jacket",
            "description": "Classic genuine leather jacket in black, perfect for any season",
            "price": 249.99,
            "images": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
            "category": "Fashion",
            "stock": 56,
            "rating": 4.6,
            "reviews_count": 267,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Women's Running Shoes",
            "description": "Lightweight and breathable running shoes with superior cushioning",
            "price": 119.99,
            "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
            "category": "Fashion",
            "stock": 89,
            "rating": 4.7,
            "reviews_count": 543,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Classic Denim Jeans",
            "description": "Comfortable slim-fit jeans in dark blue wash",
            "price": 59.99,
            "images": ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800"],
            "category": "Fashion",
            "stock": 145,
            "rating": 4.3,
            "reviews_count": 789,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Designer Sunglasses",
            "description": "Polarized sunglasses with UV protection and stylish frames",
            "price": 149.99,
            "images": ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800"],
            "category": "Fashion",
            "stock": 72,
            "rating": 4.5,
            "reviews_count": 234,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Leather Backpack",
            "description": "Premium leather backpack with laptop compartment",
            "price": 189.99,
            "images": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"],
            "category": "Fashion",
            "stock": 43,
            "rating": 4.6,
            "reviews_count": 156,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Modern Desk Lamp",
            "description": "Adjustable LED desk lamp with touch controls and USB charging",
            "price": 49.99,
            "images": ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
            "category": "Home & Garden",
            "stock": 98,
            "rating": 4.4,
            "reviews_count": 421,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Ergonomic Office Chair",
            "description": "Comfortable office chair with lumbar support and adjustable height",
            "price": 279.99,
            "images": ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"],
            "category": "Home & Garden",
            "stock": 34,
            "rating": 4.5,
            "reviews_count": 198,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Yoga Mat Premium",
            "description": "Non-slip yoga mat with extra cushioning, includes carrying strap",
            "price": 39.99,
            "images": ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800"],
            "category": "Sports",
            "stock": 167,
            "rating": 4.7,
            "reviews_count": 892,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Adjustable Dumbbells Set",
            "description": "Space-saving adjustable dumbbells from 5 to 52.5 lbs",
            "price": 349.99,
            "images": ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"],
            "category": "Sports",
            "stock": 28,
            "rating": 4.8,
            "reviews_count": 334,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Road Bicycle 21-Speed",
            "description": "Lightweight aluminum road bike with Shimano gears",
            "price": 499.99,
            "images": ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800"],
            "category": "Sports",
            "stock": 19,
            "rating": 4.6,
            "reviews_count": 145,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "The Art of Programming",
            "description": "Comprehensive guide to modern software development practices",
            "price": 49.99,
            "images": ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800"],
            "category": "Books",
            "stock": 234,
            "rating": 4.8,
            "reviews_count": 567,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Mystery Novel Collection",
            "description": "Box set of bestselling mystery novels by renowned author",
            "price": 79.99,
            "images": ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"],
            "category": "Books",
            "stock": 87,
            "rating": 4.7,
            "reviews_count": 423,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "LEGO Architecture Set",
            "description": "Build famous landmarks with this detailed LEGO set",
            "price": 129.99,
            "images": ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"],
            "category": "Toys & Games",
            "stock": 54,
            "rating": 4.9,
            "reviews_count": 678,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Board Game Strategy Pack",
            "description": "Classic strategy board game for 2-4 players, ages 10+",
            "price": 44.99,
            "images": ["https://images.unsplash.com/photo-1611891487727-73d27e52a0ea?w=800"],
            "category": "Toys & Games",
            "stock": 112,
            "rating": 4.6,
            "reviews_count": 289,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Remote Control Drone",
            "description": "HD camera drone with GPS and 30-minute flight time",
            "price": 399.99,
            "images": ["https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800"],
            "category": "Toys & Games",
            "stock": 31,
            "rating": 4.5,
            "reviews_count": 178,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(products)
    
    print(f"✅ Database seeded successfully!")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(products)} products")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
