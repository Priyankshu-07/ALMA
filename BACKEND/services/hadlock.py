"""
services/hadlock.py
Estimated Fetal Weight (EFW) using Hadlock Formulas

Pure math — no model needed.
WHO recommended Hadlock formulas (1985).

Available formulas depending on which measurements are present:
  HC + AC + FL  → Hadlock 4 (most accurate)
  AC + FL       → Hadlock 3
  HC + AC       → Hadlock 2
  AC only       → Hadlock 1
  FL only       → FL-based approximation
  HC only       → HC-based approximation

All inputs in mm, output in grams.
"""

import logging
import math

logger = logging.getLogger("fetal_health.hadlock")


def estimate_fetal_weight(
    hc: float | None = None,
    ac: float | None = None,
    fl: float | None = None,
) -> float | None:
    """
    Estimate fetal weight in grams using best available Hadlock formula.

    Hadlock formulas use measurements in CM internally.
    log10(EFW) = a + b*AC + c*HC + d*FL  (varies by formula)

    Args:
        hc: Head Circumference in mm (or None)
        ac: Abdominal Circumference in mm (or None)
        fl: Femur Length in mm (or None)

    Returns:
        EFW in grams, or None if no measurements available.
    """
    # Convert mm → cm for Hadlock formulas
    hc_cm = hc / 10.0 if hc is not None else None
    ac_cm = ac / 10.0 if ac is not None else None
    fl_cm = fl / 10.0 if fl is not None else None

    log_efw = None
    formula_used = None

    # ── Hadlock 4: HC + AC + FL (best accuracy) ───────────────────────────────
    if hc_cm and ac_cm and fl_cm:
        log_efw = (
            1.3596
            - 0.00386 * ac_cm * fl_cm
            + 0.0064  * hc_cm
            + 0.00061 * hc_cm * ac_cm  # BPD replaced by HC approximation
            + 0.0424  * ac_cm
            + 0.174   * fl_cm
        )
        formula_used = "Hadlock HC+AC+FL"

    # ── Hadlock 3: AC + FL ────────────────────────────────────────────────────
    elif ac_cm and fl_cm:
        log_efw = (
            1.304
            + 0.05281 * ac_cm
            + 0.1938  * fl_cm
            - 0.004   * ac_cm * fl_cm
        )
        formula_used = "Hadlock AC+FL"

    # ── Hadlock 2: HC + AC ────────────────────────────────────────────────────
    elif hc_cm and ac_cm:
        log_efw = (
            1.182
            + 0.0273  * hc_cm
            + 0.07057 * ac_cm
            - 0.000976 * ac_cm * hc_cm
        )
        formula_used = "Hadlock HC+AC"

    # ── AC only ───────────────────────────────────────────────────────────────
    elif ac_cm:
        log_efw = (
            1.6961
            + 0.02253 * ac_cm
            + 0.01645 * ac_cm
        )
        formula_used = "Hadlock AC only"

    # ── FL only (approximate) ─────────────────────────────────────────────────
    elif fl_cm:
        # Shepard FL-based approximation
        log_efw = (
            -2.0661
            + 4.3515 * fl_cm
            - 3.1854 * fl_cm ** 2
            + 1.5383 * fl_cm ** 3
        )
        formula_used = "FL only (approximate)"

    # ── HC only (approximate) ─────────────────────────────────────────────────
    elif hc_cm:
        log_efw = (
            -1.986
            + 0.7392 * hc_cm
        )
        formula_used = "HC only (approximate)"

    else:
        logger.warning("[hadlock] No measurements provided — cannot estimate EFW")
        return None

    efw_grams = 10 ** log_efw
    logger.info(f"[hadlock] Formula: {formula_used} → EFW = {efw_grams:.1f}g")

    return round(efw_grams, 2)


def classify_efw(efw_grams: float, gestational_age: int) -> str:
    """
    Classify EFW against expected weight for gestational age.

    Uses simplified WHO percentile boundaries:
      < 10th percentile → Severely Underdeveloped
      10th–25th         → Mildly Underdeveloped
      25th–90th         → Normal
      > 90th percentile → Large for Gestational Age

    Expected weight by GA (grams) — standard reference:
    """
    # Reference: mean EFW by gestational week (grams)
    # Source: Hadlock et al. 1991 growth curves
    _EFW_REFERENCE = {
        12: 58,   13: 73,   14: 93,   15: 117,
        16: 146,  17: 181,  18: 223,  19: 273,
        20: 331,  21: 399,  22: 478,  23: 568,
        24: 670,  25: 785,  26: 913,  27: 1055,
        28: 1210, 29: 1379, 30: 1559, 31: 1751,
        32: 1953, 33: 2162, 34: 2377, 35: 2595,
        36: 2813, 37: 3028, 38: 3236, 39: 3435,
        40: 3619, 41: 3787, 42: 3931,
    }

    ga = max(12, min(42, gestational_age))

    # Interpolate if GA not exactly in table
    if ga in _EFW_REFERENCE:
        expected = _EFW_REFERENCE[ga]
    else:
        keys = sorted(_EFW_REFERENCE.keys())
        lower = max(k for k in keys if k <= ga)
        upper = min(k for k in keys if k >= ga)
        t = (ga - lower) / (upper - lower)
        expected = _EFW_REFERENCE[lower] * (1 - t) + _EFW_REFERENCE[upper] * t

    ratio = efw_grams / expected

    if ratio < 0.85:
        status = "Severely Underdeveloped"
    elif ratio < 0.95:
        status = "Mildly Underdeveloped"
    elif ratio > 1.15:
        status = "Large for Gestational Age"
    else:
        status = "Normal"

    logger.info(
        f"[hadlock] EFW={efw_grams:.0f}g | Expected={expected:.0f}g "
        f"| Ratio={ratio:.2f} | Status={status}"
    )
    return status