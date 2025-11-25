"""HTTP client helpers for the Open-Meteo APIs used by the MCP server."""

import json
import logging
import time
from uuid import uuid4
from typing import List, Dict, Any, Optional

import httpx

from .config import GEOCODING_API_URL, WEATHER_API_URL, MAX_LOCATION_SEARCH_RESULTS

logger = logging.getLogger("OpenMeteoMCP.APIClient")


def _format_payload(payload: Any, limit: int = 800) -> str:
    """Serialize payloads for logging without overwhelming the logs."""
    try:
        text = json.dumps(payload, default=str)
    except Exception:
        text = str(payload)
    if len(text) > limit:
        return f"{text[:limit]}... [truncated]"
    return text


async def search_locations(location_name: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search for locations using the geocoding API"""
    params = {
        "name": location_name,
        "count": min(limit, MAX_LOCATION_SEARCH_RESULTS),
        "format": "json"
    }

    request_id = uuid4().hex[:8]
    logger.info(
        "[%s] Open-Meteo geocoding request url=%s params=%s",
        request_id,
        GEOCODING_API_URL,
        params,
    )
    start_time = time.perf_counter()

    async with httpx.AsyncClient() as client:
        response = await client.get(GEOCODING_API_URL, params=params)
        duration_ms = (time.perf_counter() - start_time) * 1000

        if response.status_code == 200:
            data = response.json()
            results = data.get("results", [])
            logger.info(
                "[%s] Open-Meteo geocoding response status=%s results=%s duration=%.2fms",
                request_id,
                response.status_code,
                len(results),
                duration_ms,
            )
            logger.debug("[%s] Geocoding payload: %s", request_id, _format_payload(data))
            return results

        error_data = response.json()
        logger.error(
            "[%s] Geocoding request failed status=%s duration=%.2fms body=%s",
            request_id,
            response.status_code,
            duration_ms,
            _format_payload(error_data),
        )
        raise ValueError(f"Geocoding API error: {error_data.get('reason', 'Unknown error')}")


async def get_weather_data(latitude: float, longitude: float, 
                          current: Optional[List[str]] = None,
                          hourly: Optional[List[str]] = None,
                          daily: Optional[List[str]] = None,
                          forecast_days: int = 7,
                          temperature_unit: str = "celsius",
                          wind_speed_unit: str = "kmh",
                          precipitation_unit: str = "mm") -> Dict[str, Any]:
    """Get weather data from Open-Meteo forecast API"""
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "temperature_unit": temperature_unit,
        "wind_speed_unit": wind_speed_unit,
        "precipitation_unit": precipitation_unit,
        "forecast_days": forecast_days
    }
    
    if current:
        params["current"] = ",".join(current)
    if hourly:
        params["hourly"] = ",".join(hourly)
    if daily:
        params["daily"] = ",".join(daily)

    request_id = uuid4().hex[:8]
    logger.info(
        "[%s] Open-Meteo weather request url=%s params=%s",
        request_id,
        WEATHER_API_URL,
        params,
    )
    start_time = time.perf_counter()

    async with httpx.AsyncClient() as client:
        response = await client.get(WEATHER_API_URL, params=params)
        duration_ms = (time.perf_counter() - start_time) * 1000

        if response.status_code == 200:
            payload = response.json()
            logger.info(
                "[%s] Open-Meteo weather response status=%s keys=%s duration=%.2fms",
                request_id,
                response.status_code,
                list(payload.keys()),
                duration_ms,
            )
            logger.debug("[%s] Weather payload: %s", request_id, _format_payload(payload))
            return payload

        error_data = response.json()
        logger.error(
            "[%s] Weather request failed status=%s duration=%.2fms body=%s",
            request_id,
            response.status_code,
            duration_ms,
            _format_payload(error_data),
        )
        raise ValueError(f"Weather API error: {error_data.get('reason', 'Unknown error')}")
