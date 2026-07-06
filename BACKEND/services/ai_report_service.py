import os
import json
import logging
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()
logger = logging.getLogger("fetal_health")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")
REPORT_SCHEMA_HINT = """
Return ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{
    "executive_summary": "string",
    "overall_status": "string",
    "maternal_analysis": {"summary": "string", "key_findings": ["string"]},
    "fetal_heart_analysis": {"summary": "string", "key_findings": ["string"]},
    "ultrasound_analysis": {"summary": "string", "key_findings": ["string"]},
    "combined_interpretation": "string",
    "risk_indicators": ["string"],
    "recommendations": ["string"],
    "monitoring_priority": "Routine" | "Elevated" | "Urgent"
}
"""
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
{REPORT_SCHEMA_HINT}
"""
def _extract_json(raw_text: str) -> dict:
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                pass
        logger.error(f"Failed to parse Gemini response as JSON: {raw_text[:500]}")
        raise ValueError("AI report service returned invalid JSON")
def generate_ai_report(combined_data: dict) -> dict:
    prompt = _build_prompt(combined_data)
    try:
        response = model.generate_content(prompt)
        return _extract_json(response.text)
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