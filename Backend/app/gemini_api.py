# app/gemini.py
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-pro")  # or latest available

# def generate_sql(user_query, schema_description, visualization=None):
#     # Add visualization guidance to the prompt only if provided
#     viz_note = f"""
# The output will be shown as a {visualization} chart.
# Make sure the SQL query returns appropriate columns for this chart type.
# """ if visualization else ""

#     prompt = f"""
# You are a SQL expert. Here's the database schema:

# {schema_description}

# User question: "{user_query}"
# {viz_note}

# Write a MySQL SQL query to answer the question. 
# Do NOT include explanations or markdown code blocks. Just return the raw SQL query.
# """

#     response = model.generate_content(prompt)
#     raw_sql = response.text.strip()

#     # In case Gemini still includes code block formatting, remove it
#     cleaned_sql = raw_sql.replace("```sql", "").replace("```", "").strip()

#     return cleaned_sql

def get_column_guidance(chart_type: str) -> str:
    match chart_type.lower():
        case "bar" | "line":
            return """
The SQL result must return:
- `label`: any category or dimension (e.g. item name, table name, date)
- `value`: the corresponding numeric metric (e.g. quantity, revenue, count)
"""
        case "pie":
            return """
The SQL result must return:
- `name`: the slice label (e.g. item, table, category)
- `value`: the numeric value for each slice (e.g. count or total)
"""
        case "table":
            return """
Return a SQL result suitable for displaying in a table.

The result should include:
- Relevant columns based on the question (e.g. item name, quantity, table number, date)
- Keys must be clean, user-friendly, and descriptive — not generic or auto-generated

Avoid unnecessary columns. The structure should allow easy tabular rendering.
"""
        case "list":
            return """
No SQL is needed. just strucutre result in a user friendly key value pairs.
"""
        case "none":
            return """
No SQL is needed. Just return a user-friendly text response.
"""
        case _:
            return ""  # fallback


def generate_sql(user_query, schema_description, visualization=None):
   


    # If visualization is provided, build prompt snippet
    viz_note = get_column_guidance(visualization) if visualization else ""

    # Final prompt
    prompt = f"""
You are a MySQL expert. Use the schema below to generate a query.

Schema:
{schema_description}

User question:
"{user_query}"

{viz_note}

Respond only with valid MySQL query. No explanations. No markdown formatting.
"""

    response = model.generate_content(prompt)
    raw_sql = response.text.strip()

    # Clean up any extra formatting just in case
    cleaned_sql = raw_sql.replace("```sql", "").replace("```", "").strip()
    return cleaned_sql



def ask_gemini(prompt: str) -> str:
    response = model.generate_content(prompt)
    return response.text.strip()


def analyze_report_query(user_query: str) -> dict:
    """
    Returns:
    {
        "requires_visualization": bool,
        "bot_response": str
    }
    """
    prompt = f"""
You are a smart assistant in a restaurant dashboard.

A user asked: "{user_query}"

1. Decide if this is a **report-style query**, meaning it's asking about:
   - totals
   - counts
   - trends
   - comparisons
   - summaries
   - time-based sales or quantities
   - anything that could be shown in a chart or table.

2. Then give a friendly, restaurant-themed answer to the user's question.

Respond in **this exact format**:
Report: true or false
Answer: <your restaurant-themed reply here>
"""

    try:
        response = ask_gemini(prompt).strip()

        # Example Gemini response:
        # Report: true
        # Answer: You got it! Let me show you a tasty summary.

        report_line, answer_line = response.split("Answer:")
        report_value = "true" in report_line.lower()
        reply = answer_line.strip()

        return {
            "requires_visualization": report_value,
            "bot_response": reply
        }

    except Exception as e:
        return {
            "error": str(e),
            "requires_visualization": False,
            "bot_response": "Sorry, I couldn’t understand that request."
        }
