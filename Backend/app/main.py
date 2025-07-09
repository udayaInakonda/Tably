# FastAPI app starts here

# app/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from app.db import get_connection
from app.gemini_api import generate_sql, analyze_report_query
from fastapi.middleware.cors import CORSMiddleware


# from .db import get_connection


app = FastAPI()


app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_SCHEMA = """
Table: tables
- table_id (int)
- seating_area (varchar)

Table: menu_items
- item_id (int)
- item_name (varchar)
- price (decimal)

Table: orders
- order_id (int)
- table_id (int) — references tables(table_id)
- item_id (int) — references menu_items(item_id)
- quantity (int)
- order_time (datetime)
"""


class QueryRequest(BaseModel):
    user_query: str
    visualization: str  # "bar", "line", "pie", "table", "list"

class AnalyzeRequest(BaseModel):
    user_query: str

@app.post("/query")
def ask_database(req: QueryRequest):
    user_question = req.user_query  # ✅ FIXED this line
    viz_type = req.visualization    # ✅ new: extract visualization type

    # ✅ pass both user question and visualization type to Gemini
    sql_query = generate_sql(user_question, DB_SCHEMA, viz_type)

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(sql_query)
        result = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        data = [dict(zip(columns, row)) for row in result]
    except Exception as e:
        return {"error": str(e), "sql": sql_query}
    finally:
        cursor.close()
        conn.close()

    return {
        "user_query": user_question,
        "visualization": viz_type,     # ✅ return visualization type
        "columns": columns,
        "data": data,
        "sql_query": sql_query
    }

@app.post("/analyze")
def analyze_query(req: AnalyzeRequest):
    try:
        result = analyze_report_query(req.user_query)
        return result
    except Exception as e:
        return { "error": str(e) }