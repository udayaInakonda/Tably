import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load your .env file
load_dotenv()

# Set up Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# List available models
models = genai.list_models()
for m in models:
    print(f"Model Name: {m.name} | Methods: {m.supported_generation_methods}")
