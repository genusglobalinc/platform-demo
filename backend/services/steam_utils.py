import os
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Get Steam API key from environment variable
STEAM_API_KEY = os.environ.get("STEAM_API_KEY", "")

def fetch_steam_profile(steam_input: str) -> Optional[Dict[str, Any]]:
    """
    Fetch Steam profile data from the Steam Web API.
    Can accept either a Steam ID or vanity URL.
    """
    try:
        if not STEAM_API_KEY:
            logger.warning("STEAM_API_KEY not configured; skipping Steam lookup")
            return None

        steamid = steam_input
        if not steam_input.isdigit():
            vanity_resp = requests.get(
                f"https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/",
                params={"key": STEAM_API_KEY, "vanityurl": steam_input},
                timeout=10,
            ).json()
            if vanity_resp.get("response", {}).get("success") != 1:
                return None
            steamid = vanity_resp["response"]["steamid"]

        summ_resp = requests.get(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
            params={"key": STEAM_API_KEY, "steamids": steamid}, timeout=10
        ).json()
        players = summ_resp.get("response", {}).get("players", [])
        if not players:
            return None
        p = players[0]
        return {
            "steam_id": steamid,
            "persona_name": p.get("personaname"),
            "avatar": p.get("avatarfull"),
            "profile_url": p.get("profileurl"),
            "time_created": p.get("timecreated"),
            "last_logoff": p.get("lastlogoff"),
            "visibility": p.get("communityvisibilitystate"),
            "profile_state": p.get("profilestate"),
            "real_name": p.get("realname"),
            "primary_clan_id": p.get("primaryclanid"),
            "game_extra_info": p.get("gameextrainfo"),
            "game_id": p.get("gameid"),
            "loc_country_code": p.get("loccountrycode"),
            "loc_state_code": p.get("locstatecode"),
            "loc_city_id": p.get("loccityid")
        }
    except Exception as e:
        logger.error(f"Error fetching Steam profile: {e}")
        return None
