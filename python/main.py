import uvicorn
from src.app import app
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    uvicorn.run("src.app:app", host="0.0.0.0", port=8090, reload=True)
