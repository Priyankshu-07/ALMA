import os
import json
import logging
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

logger = logging.getLogger("fetal_health")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in .env")

client = Groq(api_key=GROQ_API_KEY)


def _build_prompt(combined_data: dict) -> str:
    return f"""
You are an AI report generation system for a fetal health analysis research project.
This is an academic/research tool, NOT a clinical diagnostic system.

MODEL RESULTS (already computed by separate ML models — do not recompute or alter them):

{json.dumps(combined_data, indent=2)}

The field "computed_priority" was calculated deterministically by backend logic.
Use it directly as "monitoring_priority" in your output — do not override it.

Rules:

- Return ONLY valid JSON.
- Do NOT wrap the JSON in markdown.
- Do NOT include explanations.
- Do NOT invent patient data.
- Do NOT provide a diagnosis.
- If data is missing, mention it as unavailable.
- Keep summaries concise (2–4 sentences).

Return JSON in exactly this format:

{{
  "executive_summary": "",
  "overall_status": "",
  "maternal_analysis": {{
      "summary": "",
      "key_findings": []
  }},
  "fetal_heart_analysis": {{
      "summary": "",
      "key_findings": []
  }},
  "ultrasound_analysis": {{
      "summary": "",
      "key_findings": []
  }},
  "combined_interpretation": "",
  "risk_indicators": [],
  "recommendations": [],
  "monitoring_priority": ""
}}
"""


def generate_ai_report(combined_data: dict) -> dict:

    prompt = _build_prompt(combined_data)

    try:

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert medical report generator. Always return valid JSON only."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        report = response.choices[0].message.content.strip()

        if report.startswith("```"):
            report = report.replace("```json", "").replace("```", "").strip()

        return json.loads(report)

    except Exception as e:
        logger.error(f"AI report generation failed: {e}")

        return {
            "executive_summary": "Report generation failed. Please retry.",
            "overall_status": "Unknown",
            "maternal_analysis": {
                "summary": "Unavailable",
                "key_findings": []
            },
            "fetal_heart_analysis": {
                "summary": "Unavailable",
                "key_findings": []
            },
            "ultrasound_analysis": {
                "summary": "Unavailable",
                "key_findings": []
            },
            "combined_interpretation": "Unavailable due to a generation error.",
            "risk_indicators": [],
            "recommendations": [
                "Please retry generating the report."
            ],
            "monitoring_priority": combined_data.get(
                "computed_priority",
                "Routine"
            ),
        }