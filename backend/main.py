from fastapi import FastAPI

app = FastAPI(title="Virtual Smart Hub")

@app.get("/")
def read_root():
    return {"status": "Online", "mesaj": "Sistemul Virtual Smart Hub functioneaza!"}