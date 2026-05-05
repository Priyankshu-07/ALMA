
import logging
import math

logger = logging.getLogger("fetal_health.hadlock")


def estimate_fetal_weight(
    hc: float | None = None,
    ac: float | None = None,
    fl: float | None = None,
) -> float | None:

    hc_cm = hc / 10.0 if hc is not None else None
    ac_cm = ac / 10.0 if ac is not None else None
    fl_cm = fl / 10.0 if fl is not None else None

    log_efw = None
    formula_used = None

    if hc_cm and ac_cm and fl_cm:
        log_efw = (
            1.3596
            - 0.00386 * ac_cm * fl_cm
            + 0.0064  * hc_cm
            + 0.00061 * hc_cm * ac_cm
            + 0.0424  * ac_cm
            + 0.174   * fl_cm
        )
        formula_used = "Hadlock HC+AC+FL"

    elif ac_cm and fl_cm:
        log_efw = (
            1.304
            + 0.05281 * ac_cm
            + 0.1938  * fl_cm
            - 0.004   * ac_cm * fl_cm
        )
        formula_used = "Hadlock AC+FL"

    elif hc_cm and ac_cm:
        log_efw = (
            1.182
            + 0.0273  * hc_cm
            + 0.07057 * ac_cm
            - 0.000976 * ac_cm * hc_cm
        )
        formula_used = "Hadlock HC+AC"

    elif ac_cm:
        log_efw = (
            1.6961
            + 0.02253 * ac_cm
            + 0.01645 * ac_cm
        )
        formula_used = "Hadlock AC only"

    elif fl_cm:
        log_efw = 0.9119 + 0.4162 * fl_cm
        formula_used = "FL only (approximate)"

    elif hc_cm:
        log_efw = 0.9308 + 0.2616 * hc_cm
        formula_used = "HC only (approximate)"

    else:
        logger.warning("[hadlock] No measurements provided — cannot estimate EFW")
        return None

    efw_grams = 10 ** log_efw
    logger.info(f"[hadlock] Formula: {formula_used} → EFW = {efw_grams:.1f}g")

    return round(efw_grams, 2)


def classify_efw(efw_grams: float, gestational_age: int) -> str:

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