from typing import Optional, Dict, Any
def _safe(result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    return result if result else {"status": "missing", "prediction": None}
def _compute_priority(maternal_result, fhr_result, ultrasound_results) -> str:
    score = 0
    maternal_pred = (maternal_result or {}).get("prediction", "") or ""
    if maternal_pred.lower() == "high":
        score += 2
    elif maternal_pred.lower() == "medium":
        score += 1
    fhr_pred = (fhr_result or {}).get("prediction", "") or ""
    if fhr_pred.lower() == "pathological":
        score += 3
    elif fhr_pred.lower() == "suspect":
        score += 1
    for r in ultrasound_results or []:
        growth = (r.get("growth_status") or "").lower()
        if growth == "underdeveloped":
            score += 2
        elif growth == "overgrowth":
            score += 1
        if r.get("error"):
            score += 1
    if score >= 5:
        return "URGENT"
    elif score >= 2:
        return "ELEVATED"
    return "ROUTINE"
def aggregate_results(
    maternal_result: Optional[Dict[str, Any]],
    fhr_result: Optional[Dict[str, Any]],
    ultrasound_results: Optional[list],
) -> Dict[str, Any]:
    ultrasound_results = ultrasound_results or []
    return {
        "maternal_analysis": _safe(maternal_result),
        "fhr_analysis": _safe(fhr_result),
        "ultrasound_analysis": ultrasound_results,
        "computed_priority": _compute_priority(
            maternal_result, fhr_result, ultrasound_results
        ),
    }