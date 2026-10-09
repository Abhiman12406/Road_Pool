"""
Supabase Client Singleton & Connection Factory
Provides safe, graceful connectivity to Supabase PostgreSQL database.
Falls back silently to in-memory mode if credentials are missing or network is unavailable.
"""
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("ridepool.db.supabase")

_supabase_client = None
_client_initialized = False

def get_supabase_client():
    """
    Returns the initialized Supabase client singleton, or None if unconfigured.
    """
    global _supabase_client, _client_initialized
    
    if _client_initialized:
        return _supabase_client

    if not settings.is_supabase_configured:
        logger.info(
            "[Supabase] Not configured or credentials are placeholders. "
            "Running with in-memory persistence engine."
        )
        _client_initialized = True
        _supabase_client = None
        return None

    try:
        from supabase import create_client, ClientOptions
        # Initialize client with timeout options
        _supabase_client = create_client(
            supabase_url=settings.SUPABASE_URL,
            supabase_key=settings.SUPABASE_KEY
        )
        logger.info("[Supabase] Client initialized successfully for %s", settings.SUPABASE_URL)
    except Exception as exc:
        logger.warning(
            "[Supabase] Could not connect to Supabase: %s. "
            "Falling back to in-memory state.",
            exc
        )
        _supabase_client = None

    _client_initialized = True
    return _supabase_client

def is_supabase_enabled() -> bool:
    """Checks whether live Supabase integration is currently active."""
    return get_supabase_client() is not None
