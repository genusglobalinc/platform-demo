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
    Works for all user types (Dev, Tester, Admin).
    """
    try:
        # Validate and clean the input
        if not steam_input or not isinstance(steam_input, str):
            logger.warning(f"Invalid Steam input: {steam_input}")
            return None
            
        # Clean the input by removing any extra spaces or URL components
        steam_input = steam_input.strip()
        
        # Remove common URL prefixes if they're included
        if steam_input.startswith(('http://', 'https://')):
            logger.info(f"Converting URL to Steam ID: {steam_input}")
            # Extract the ID or username from common Steam URL patterns
            if '/id/' in steam_input:
                steam_input = steam_input.split('/id/')[1].split('/')[0]
                logger.debug(f"Extracted vanity URL: {steam_input}")
            elif '/profiles/' in steam_input:
                steam_input = steam_input.split('/profiles/')[1].split('/')[0]
                logger.debug(f"Extracted Steam ID: {steam_input}")
        
        # Check if API key is configured
        if not STEAM_API_KEY:
            logger.warning("STEAM_API_KEY not configured; skipping Steam lookup")
            return None

        # Log what we're doing
        logger.debug(f"Processing Steam input: {steam_input}")

        # Try to resolve vanity URL if it's not just a numeric Steam ID
        steamid = steam_input
        if not steam_input.isdigit():
            logger.debug(f"Input is not numeric, trying to resolve vanity URL: {steam_input}")
            try:
                vanity_resp = requests.get(
                    f"https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/",
                    params={"key": STEAM_API_KEY, "vanityurl": steam_input},
                    timeout=10,
                ).json()
                
                logger.debug(f"Vanity URL API response: {vanity_resp}")
                
                if vanity_resp.get("response", {}).get("success") != 1:
                    logger.warning(f"Could not resolve vanity URL: {steam_input}")
                    return None
                    
                steamid = vanity_resp["response"]["steamid"]
                logger.info(f"Resolved vanity URL to SteamID: {steamid}")
            except Exception as e:
                logger.error(f"Error resolving vanity URL: {e}")
                return None

        # Now fetch the user's Steam profile using their SteamID
        logger.debug(f"Fetching profile for SteamID: {steamid}")
        try:
            summ_resp = requests.get(
                "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/",
                params={"key": STEAM_API_KEY, "steamids": steamid}, 
                timeout=10
            ).json()
            
            logger.debug(f"Player summaries API response: {summ_resp}")
            
            players = summ_resp.get("response", {}).get("players", [])
            if not players:
                logger.warning(f"No player profile found for SteamID: {steamid}")
                return None
                
            p = players[0]
            logger.info(f"Successfully fetched profile for {p.get('personaname')}")
            
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
            logger.error(f"Error fetching player summary: {e}")
            return None
    except Exception as e:
        logger.error(f"Error in Steam profile fetching process: {e}", exc_info=True)
        return None
