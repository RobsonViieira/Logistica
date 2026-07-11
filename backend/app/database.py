# ── Configuração do banco de dados (SQLite para demo, MySQL para produção) ──

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# SQLite para demo local / MySQL para produção
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./glm.db")

# connect_args necessário apenas para SQLite (thread safety)
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency injection do banco — fecha sessão automaticamente"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
