from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from app.schemas import CountryScore


# Hard constraints intentionally limited to avoid premature empty results.
HARD_CONSTRAINTS: Dict[str, Dict[str, str]] = {
    "q4": {
        "A": "access_land",
        "B": "access_air",
        "C": "access_sea",
    },
    "q10": {
        "A": "crime_near_zero",
    },
    "q22": {
        "A": "no_hurricane_zone",
    },
    "q23": {
        "A": "tectonically_quiet",
    },
    "q39": {
        "A": "internet_top_tier",
    },
}

# Weighted preferences across the questionnaire to keep recommendations meaningful.
WEIGHTED_RULES: Dict[str, Dict[str, Dict[str, float]]] = {
    "q5": {
        "A": {"democracy_index": 1.0},
        "B": {"order_stability": 0.9},
        "C": {"personal_freedom_property": 1.0},
    },
    "q6": {
        "A": {"strategic_isolation": 1.0},
        "B": {"neutrality": 1.0},
        "C": {"global_hub": 0.8},
    },
    "q7": {
        "A": {"civil_liberties_policy": 1.0},
        "B": {"state_control_acceptance": 1.0},
    },
    "q8": {
        "A": {"property_protection": 1.0},
        "B": {"emerging_market_risk_reward": 1.0},
    },
    "q12": {
        "A": {"gun_rights": 1.0},
        "B": {"strict_gun_control": 1.0},
    },
    "q13": {
        "A": {"internet_freedom": 1.0},
        "B": {"regulated_internet": 1.0},
    },
    "q17": {
        "A": {"climate_tropical": 1.0},
        "B": {"climate_mediterranean": 1.0},
        "C": {"climate_four_seasons": 1.0},
        "D": {"climate_cool": 1.0},
    },
    "q18": {
        "A": {"humidity_high": 1.0},
        "B": {"humidity_low": 1.0},
    },
    "q19": {
        "A": {"sun_days_high": 1.0},
        "B": {"sun_days_mixed": 1.0},
        "C": {"sun_days_low": 1.0},
    },
    "q21": {
        "A": {"climate_refuge": 1.0},
        "B": {"extreme_weather_tolerance": 0.7},
    },
    "q24": {
        "A": {"winter_daylight_high": 1.0},
        "B": {"winter_daylight_low_ok": 1.0},
    },
    "q25": {
        "A": {"landscape_coast": 1.0},
        "B": {"landscape_mountains": 1.0},
        "C": {"landscape_forests": 1.0},
        "D": {"landscape_urban": 1.0},
    },
    "q29": {
        "A": {"island_life": 1.0},
        "B": {"mainland_life": 1.0},
    },
    "q32": {
        "A": {"settlement_megacity": 1.0},
        "B": {"settlement_mid_city": 1.0},
        "C": {"settlement_small_town": 1.0},
        "D": {"settlement_off_grid": 1.0},
    },
    "q34": {
        "A": {"mobility_car": 1.0},
        "B": {"mobility_public_transport": 1.0},
        "C": {"mobility_scooter": 1.0},
    },
    "q37": {
        "A": {"noise_quiet": 1.0},
        "B": {"noise_city": 1.0},
    },
    "q39": {
        "A": {"internet_top_tier": 1.0},
        "B": {"internet_stable": 1.0},
        "C": {"internet_independent": 1.0},
    },
    "q41": {
        "A": {"healthcare_top": 1.0},
        "B": {"healthcare_standard": 1.0},
        "C": {"healthcare_basic": 1.0},
    },
    "q42": {
        "A": {"grid_stable": 1.0},
        "B": {"grid_partial": 1.0},
        "C": {"energy_independent": 1.0},
    },
    "q44": {
        "A": {"ecommerce_fast": 1.0},
        "B": {"ecommerce_local": 1.0},
    },
    "q46": {
        "A": {"language_english": 1.0},
        "B": {"language_spanish_portuguese": 1.0},
        "C": {"language_any": 1.0},
    },
    "q47": {
        "A": {"community_expats": 1.0},
        "B": {"community_local": 1.0},
        "C": {"community_solitude": 1.0},
    },
    "q50": {
        "A": {"bureaucracy_fast": 1.0},
        "B": {"pace_slow": 1.0},
    },
    "q51": {
        "A": {"social_liberal": 1.0},
        "B": {"social_conservative": 1.0},
        "C": {"social_neutral": 1.0},
    },
    "q54": {
        "A": {"budget_low": 1.0},
        "B": {"budget_mid": 1.0},
        "C": {"budget_premium": 1.0},
        "D": {"budget_luxury": 1.0},
    },
    "q55": {
        "A": {"tax_optimization": 1.0},
        "B": {"tax_service_balance": 1.0},
        "C": {"tax_neutral": 1.0},
    },
    "q59": {
        "A": {"self_sufficiency": 1.0},
        "B": {"city_comfort": 1.0},
    },
}


@dataclass
class ScoreState:
    matched: float = 0.0
    considered: float = 0.0


def _passes_hard_constraints(country_profiles: Dict[str, float], answers: Dict[str, str]) -> bool:
    for question_id, option_map in HARD_CONSTRAINTS.items():
        selected = answers.get(question_id)
        if not selected:
            continue
        required_flag = option_map.get(selected)
        if required_flag and country_profiles.get(required_flag, 0.0) < 0.5:
            return False
    return True


def _weighted_score(country_profiles: Dict[str, float], answers: Dict[str, str]) -> ScoreState:
    state = ScoreState()

    for question_id, selected_option in answers.items():
        option_weights = WEIGHTED_RULES.get(question_id, {}).get(selected_option)
        if not option_weights:
            continue

        for profile_key, expected_weight in option_weights.items():
            actual = float(country_profiles.get(profile_key, 0.0))
            state.considered += expected_weight
            state.matched += actual * expected_weight

    return state


def score_countries(countries: List[Dict], answers: Dict[str, str]) -> Tuple[List[str], List[CountryScore]]:
    scored: List[CountryScore] = []

    for country in countries:
        profiles: Dict[str, float] = country["profiles"]
        hard_passed = _passes_hard_constraints(profiles, answers)
        if not hard_passed:
            continue

        weighted = _weighted_score(profiles, answers)
        if weighted.considered <= 0:
            score = 50.0
            matched_ratio = 0.5
        else:
            matched_ratio = weighted.matched / weighted.considered
            score = round(matched_ratio * 100.0, 2)

        scored.append(
            CountryScore(
                iso3=country["iso3"],
                country=country["country"],
                score=score,
                hard_constraints_passed=hard_passed,
                matched=round(weighted.matched, 2),
                considered=round(weighted.considered, 2),
            )
        )

    scored.sort(key=lambda item: (-item.score, item.country))
    remaining = [item.iso3 for item in scored]
    top = scored[:10]
    return remaining, top
