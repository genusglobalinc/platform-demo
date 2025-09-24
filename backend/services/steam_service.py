import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
from backend.config import get_settings
import logging

logger = logging.getLogger(__name__)

class SteamService:
    """Service for interacting with Steam Web API"""
    
    def __init__(self):
        self.settings = get_settings()
        self.api_key = self.settings.steam_api_key
        self.base_url = "https://api.steampowered.com"
        
    async def get_owned_games(self, steam_id: str, include_appinfo: bool = True, include_played_free_games: bool = True) -> Optional[Dict[str, Any]]:
        """
        Get list of games owned by a Steam user
        
        Args:
            steam_id: Steam 64-bit ID of the user
            include_appinfo: Include game name and logo information
            include_played_free_games: Include free games that have been played
            
        Returns:
            Dictionary containing games data or None if error
        """
        if not self.api_key:
            logger.error("Steam API key not configured")
            return None
            
        url = f"{self.base_url}/IPlayerService/GetOwnedGames/v1/"
        params = {
            "key": self.api_key,
            "steamid": steam_id,
            "format": "json",
            "include_appinfo": 1 if include_appinfo else 0,
            "include_played_free_games": 1 if include_played_free_games else 0
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", {})
                    else:
                        logger.error(f"Steam API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching owned games: {str(e)}")
            return None
    
    async def get_recently_played_games(self, steam_id: str, count: int = 10) -> Optional[Dict[str, Any]]:
        """
        Get recently played games for a Steam user
        
        Args:
            steam_id: Steam 64-bit ID of the user
            count: Number of games to return (max 0-unlimited)
            
        Returns:
            Dictionary containing recently played games or None if error
        """
        if not self.api_key:
            logger.error("Steam API key not configured")
            return None
            
        url = f"{self.base_url}/IPlayerService/GetRecentlyPlayedGames/v1/"
        params = {
            "key": self.api_key,
            "steamid": steam_id,
            "format": "json",
            "count": count
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", {})
                    else:
                        logger.error(f"Steam API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching recently played games: {str(e)}")
            return None
    
    async def get_player_summaries(self, steam_ids: List[str]) -> Optional[Dict[str, Any]]:
        """
        Get player summary information for one or more Steam users
        
        Args:
            steam_ids: List of Steam 64-bit IDs (max 100)
            
        Returns:
            Dictionary containing player summaries or None if error
        """
        if not self.api_key:
            logger.error("Steam API key not configured")
            return None
            
        if len(steam_ids) > 100:
            logger.error("Too many Steam IDs (max 100)")
            return None
            
        url = f"{self.base_url}/ISteamUser/GetPlayerSummaries/v2/"
        params = {
            "key": self.api_key,
            "steamids": ",".join(steam_ids),
            "format": "json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", {})
                    else:
                        logger.error(f"Steam API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching player summaries: {str(e)}")
            return None
    
    async def get_steam_level(self, steam_id: str) -> Optional[int]:
        """
        Get Steam level for a user
        
        Args:
            steam_id: Steam 64-bit ID of the user
            
        Returns:
            Steam level as integer or None if error
        """
        if not self.api_key:
            logger.error("Steam API key not configured")
            return None
            
        url = f"{self.base_url}/IPlayerService/GetSteamLevel/v1/"
        params = {
            "key": self.api_key,
            "steamid": steam_id,
            "format": "json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("response", {}).get("player_level")
                    else:
                        logger.error(f"Steam API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching Steam level: {str(e)}")
            return None
    
    def format_playtime(self, playtime_minutes: int) -> str:
        """
        Format playtime from minutes to human-readable string
        
        Args:
            playtime_minutes: Playtime in minutes
            
        Returns:
            Formatted playtime string
        """
        if playtime_minutes == 0:
            return "Never played"
        
        hours = playtime_minutes / 60
        
        if hours < 1:
            return f"{playtime_minutes} minutes"
        elif hours < 24:
            return f"{hours:.1f} hours"
        else:
            days = hours / 24
            return f"{days:.1f} days ({hours:.1f} hours)"
    
    async def get_user_gaming_profile(self, steam_id: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive gaming profile for a user including owned games, recent activity, and profile info
        
        Args:
            steam_id: Steam 64-bit ID of the user
            
        Returns:
            Dictionary containing comprehensive gaming profile
        """
        try:
            # Fetch all data concurrently
            owned_games_task = self.get_owned_games(steam_id)
            recent_games_task = self.get_recently_played_games(steam_id)
            player_summary_task = self.get_player_summaries([steam_id])
            steam_level_task = self.get_steam_level(steam_id)
            
            owned_games, recent_games, player_summary, steam_level = await asyncio.gather(
                owned_games_task,
                recent_games_task,
                player_summary_task,
                steam_level_task,
                return_exceptions=True
            )
            
            # Process owned games data
            games_data = []
            total_playtime = 0
            
            if owned_games and "games" in owned_games:
                for game in owned_games["games"]:
                    playtime_minutes = game.get("playtime_forever", 0)
                    total_playtime += playtime_minutes
                    
                    games_data.append({
                        "appid": game.get("appid"),
                        "name": game.get("name", "Unknown Game"),
                        "playtime_minutes": playtime_minutes,
                        "playtime_formatted": self.format_playtime(playtime_minutes),
                        "playtime_2weeks": game.get("playtime_2weeks", 0),
                        "img_icon_url": game.get("img_icon_url", ""),
                        "img_logo_url": game.get("img_logo_url", "")
                    })
            
            # Sort games by playtime (most played first)
            games_data.sort(key=lambda x: x["playtime_minutes"], reverse=True)
            
            # Get player info
            player_info = {}
            if player_summary and "players" in player_summary and len(player_summary["players"]) > 0:
                player = player_summary["players"][0]
                player_info = {
                    "steamid": player.get("steamid"),
                    "personaname": player.get("personaname"),
                    "profileurl": player.get("profileurl"),
                    "avatar": player.get("avatar"),
                    "avatarmedium": player.get("avatarmedium"),
                    "avatarfull": player.get("avatarfull"),
                    "personastate": player.get("personastate"),
                    "communityvisibilitystate": player.get("communityvisibilitystate"),
                    "profilestate": player.get("profilestate"),
                    "lastlogoff": player.get("lastlogoff"),
                    "commentpermission": player.get("commentpermission")
                }
            
            # Process recent games
            recent_games_data = []
            if recent_games and "games" in recent_games:
                recent_games_data = recent_games["games"]
            
            return {
                "steam_id": steam_id,
                "player_info": player_info,
                "steam_level": steam_level if not isinstance(steam_level, Exception) else None,
                "total_games": len(games_data),
                "total_playtime_minutes": total_playtime,
                "total_playtime_formatted": self.format_playtime(total_playtime),
                "owned_games": games_data,
                "recent_games": recent_games_data,
                "top_games": games_data[:10],  # Top 10 most played games
                "profile_visibility": player_info.get("communityvisibilitystate", 1) == 3  # 3 = public
            }
            
        except Exception as e:
            logger.error(f"Error getting user gaming profile: {str(e)}")
            return None

# Create a global instance
steam_service = SteamService()
