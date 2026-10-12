from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import engine
from app.db import models
from app.schemas.item import Item, ItemCreate
from app.api.deps import get_db
from app.services.redis_client import get_redis

# Create tables (In production, use Alembic)
models.Base.metadata.create_all(bind=engine)

router = APIRouter()

@router.post("/", response_model=Item)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = models.Item(title=item.title, description=item.description)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Redis integration: increment a counter when a new item is created
    redis_db = get_redis()
    try:
        redis_db.incr("items_created_count")
    except Exception as e:
        print(f"Redis error: {e}")
    
    return db_item

@router.get("/", response_model=List[Item])
def read_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    items = db.query(models.Item).offset(skip).limit(limit).all()
    return items

@router.get("/stats")
def get_stats():
    redis_db = get_redis()
    try:
        count = redis_db.get("items_created_count")
        return {"items_created": int(count) if count else 0}
    except Exception as e:
        return {"error": str(e)}
