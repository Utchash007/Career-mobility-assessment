"""Pure normalization shared by profiles, opportunity seeds and matching."""

import re
import unicodedata

COUNTRY_CODES = frozenset(
    "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO "
    "BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ "
    "DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP "
    "GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG "
    "KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML "
    "MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE "
    "PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL "
    "SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM "
    "US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split()
)
LANGUAGE_CODES = frozenset(
    "aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu "
    "cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi "
    "ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks "
    "ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl "
    "nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl "
    "sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve "
    "vi vo wa wo xh yi yo za zh zu".split()
)

SKILL_ALIASES = {
    "ms_excel": "excel",
    "microsoft_excel": "excel",
    "coordination": "project_coordination",
    "stakeholder_communications": "stakeholder_communication",
    "ml": "machine_learning",
}
COUNTRY_ALIASES = {
    "germany": "DE",
    "canada": "CA",
    "singapore": "SG",
    "switzerland": "CH",
    "bangladesh": "BD",
    "united_states": "US",
    "usa": "US",
    "united_kingdom": "GB",
    "uk": "GB",
    "france": "FR",
    "india": "IN",
    "australia": "AU",
}
LANGUAGE_ALIASES = {
    "english": "en",
    "german": "de",
    "french": "fr",
    "bengali": "bn",
    "bangla": "bn",
    "spanish": "es",
    "hindi": "hi",
    "arabic": "ar",
    "mandarin": "zh",
    "chinese": "zh",
}
FIELD_ALIASES = {
    "business_administration": "business",
    "business": "business",
    "management": "business",
    "social_science": "social_science",
    "social_sciences": "social_science",
    "sociology": "social_science",
    "political_science": "social_science",
    "computer_science": "computer_science",
    "computer_engineering": "engineering",
    "engineering": "engineering",
    "data_science": "data_science",
    "finance": "finance",
    "accounting": "finance",
    "economics": "economics",
    "humanities": "humanities",
    "other": "other",
}


def canonical_key(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("Use a text value.")
    value = unicodedata.normalize("NFKC", value).strip().lower()
    value = re.sub(r"[\s-]+", "_", value)
    if not re.fullmatch(r"[a-z][a-z0-9_]{0,59}", value):
        raise ValueError("Use a canonical key of 1–60 lowercase letters, digits or underscores.")
    return value


def skill_key(value: object) -> str:
    key = canonical_key(value)
    return SKILL_ALIASES.get(key, key)


def country_code(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("Use an ISO country code.")
    code = COUNTRY_ALIASES.get(value.strip().lower().replace(" ", "_"), value.strip().upper())
    if code not in COUNTRY_CODES:
        raise ValueError("Use a valid ISO alpha-2 country code.")
    return code


def language_code(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("Use an ISO language code.")
    code = LANGUAGE_ALIASES.get(value.strip().lower(), value.strip().lower())
    if code not in LANGUAGE_CODES:
        raise ValueError("Use a valid ISO 639-1 language code.")
    return code


def field_group(value: str | None) -> str | None:
    if not value:
        return None
    key = re.sub(r"[\s-]+", "_", unicodedata.normalize("NFKC", value).strip().lower())
    return FIELD_ALIASES.get(key)


def unique_keys(value: object, normalizer=canonical_key) -> list[str]:
    if not isinstance(value, list):
        raise ValueError("Use an array.")
    return list(dict.fromkeys(normalizer(item) for item in value))
