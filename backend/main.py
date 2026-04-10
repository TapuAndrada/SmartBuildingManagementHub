from fastapi import FastAPI
import uvicorn
from database import engine, Base
import models 

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Virtual Smart Hub")

@app.get("/")
def read_root():
    return {"status": "Online", "mesaj": "Sistemul Virtual Smart Hub functioneaza!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)