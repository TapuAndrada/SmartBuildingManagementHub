from database import SessionLocal, engine
import models
from security import get_password_hash 

def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@smarthome.com"
        exists = db.query(models.User).filter(models.User.email == admin_email).first()

        if not exists:
            print("Creating unique admin account...")
            admin_user = models.User(
                username="admin",
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin created successfully!")
        else:
            print("Admin already exists in the database.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()