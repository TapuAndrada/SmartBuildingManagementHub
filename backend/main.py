from fastapi import FastAPI
from database import engine, Base, get_db
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from dependencies import get_current_user

from routers import users, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Virtual Smart Hub")

app.include_router(auth.router)
app.include_router(users.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)