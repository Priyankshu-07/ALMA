import os
import json
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
load_dotenv()
logger = logging.getLogger("fetal_health")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")
client = genai.Client(api_key=GEMINI_API_KEY)
REPORT_SCHEMA = types.Schema(
    type=types.Type.OBJECT,
    properties={
        "executive_summary": types.Schema(type=types.Type.STRING),
        "overall_status": types.Schema(type=types.Type.STRING),
        "maternal_analysis": types.Schema(
            type=types.Type.OBJECT,
            properties={
                "summary": types.Schema(type=types.Type.STRING),
                "key_findings": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
            },
            required=["summary", "key_findings"]
        ),
        "fetal_heart_analysis": types.Schema(
            type=types.Type.OBJECT,
            properties={
                "summary": types.Schema(type=types.Type.STRING),
                "key_findings": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
            },
            required=["summary", "key_findings"]
        ),
        "ultrasound_analysis": types.Schema(
            type=types.Type.OBJECT,
            properties={
                "summary": types.Schema(type=types.Type.STRING),
                "key_findings": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
            },
            required=["summary", "key_findings"]
        ),
        "combined_interpretation": types.Schema(type=types.Type.STRING),
        "risk_indicators": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "recommendations": types.Schema(type=types.Type.ARRAY, items=types.Schema(type=types.Type.STRING)),
        "monitoring_priority": types.Schema(
            type=types.Type.STRING, 
            enum=["Routine", "Elevated", "Urgent"]
        )
    },
    required=[
        "executive_summary", "overall_status", "maternal_analysis", 
        "fetal_heart_analysis", "ultrasound_analysis", "combined_interpretation", 
        "risk_indicators", "recommendations", "monitoring_priority"
    ]
)

def _build_prompt(combined_data: dict) -> str:
    return f"""
You are an AI report generation system for a fetal health analysis research project.
This is an academic/research tool, NOT a clinical diagnostic system.

MODEL RESULTS (already computed by separate ML models — do not recompute or alter them):
{json.dumps(combined_data, indent=2)}

The field "computed_priority" was calculated deterministically by backend logic.
Use it directly as "monitoring_priority" in your output — do not override it.

Rules:
- Do not invent patient data not present above.
- Do not provide a medical diagnosis; only explain and interpret the given results.
- If a result has an "error" or is "missing", mention it plainly as inconclusive/unavailable data, don't guess.
- Keep summaries concise (2-4 sentences each).
"""

def generate_ai_report(combined_data: dict) -> dict:
    prompt = _build_prompt(combined_data)
    
    try:
        # Use client.models.generate_content instead of the legacy model instance
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=REPORT_SCHEMA,
                temperature=0.2 # Lower temperature guarantees stricter data compliance
            ),
        )
        
        # The new SDK guarantees valid JSON if response_schema is passed, safely load it directly
        return json.loads(response.text)
        
    except Exception as e:
        logger.error(f"AI report generation failed: {e}")
        return {
            "executive_summary": "Report generation failed. Please retry.",
            "overall_status": "Unknown",
            "maternal_analysis": {"summary": "Unavailable", "key_findings": []},
            "fetal_heart_analysis": {"summary": "Unavailable", "key_findings": []},
            "ultrasound_analysis": {"summary": "Unavailable", "key_findings": []},
            "combined_interpretation": "Unavailable due to a generation error.",
            "risk_indicators": [],
            "recommendations": ["Please retry generating the report."],
            "monitoring_priority": combined_data.get("computed_priority", "Routine"),
        }