"""
PCGS Public API Client

Provides OAuth2-authenticated access to PCGS CoinFacts and Auction Prices data.
Rate limited to 1,000 queries/day on free tier.

Environment variables required:
- PCGS_USERNAME: PCGS account email
- PCGS_PASSWORD: PCGS account password

API Documentation: https://api.pcgs.com/publicapi/swagger/ui/index
"""

import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import httpx

logger = logging.getLogger(__name__)


class PCGSApiError(Exception):
    """Base exception for PCGS API errors."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(PCGSApiError):
    """Authentication failed - invalid credentials or token expired."""
    pass


class QuotaExceededError(PCGSApiError):
    """Daily API quota (1,000 calls) exceeded."""
    pass


class RateLimitError(PCGSApiError):
    """Rate limit hit - too many requests."""
    pass


class PCGSApiClient:
    """
    Async client for PCGS Public API.

    Usage:
        async with PCGSApiClient() as client:
            await client.authenticate()
            coin = await client.get_coin_by_cert("12345678")
    """

    BASE_URL = "https://api.pcgs.com/publicapi"
    TOKEN_EXPIRY_BUFFER = timedelta(minutes=5)  # Refresh 5 min before expiry
    MAX_RETRIES = 3
    RETRY_BACKOFF = 2  # seconds

    def __init__(self, quota_tracker=None):
        """
        Initialize PCGS API client.

        Args:
            quota_tracker: Optional QuotaTracker instance for rate limiting
        """
        self.username = os.getenv("PCGS_USERNAME")
        self.password = os.getenv("PCGS_PASSWORD")
        self.quota_tracker = quota_tracker

        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        """Async context manager entry."""
        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            }
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._client:
            await self._client.aclose()
            self._client = None

    def _check_credentials(self):
        """Verify credentials are set."""
        if not self.username or not self.password:
            raise AuthenticationError(
                "PCGS credentials not set. Please set PCGS_USERNAME and PCGS_PASSWORD environment variables."
            )

    def _check_quota(self):
        """Check if API quota is available."""
        if self.quota_tracker:
            if not self.quota_tracker.check_quota():
                status = self.quota_tracker.get_status()
                raise QuotaExceededError(
                    f"Daily API quota exceeded. {status['calls_made']}/{status['daily_limit']} calls used. "
                    f"Resets at midnight (next day: {status['date']})."
                )

    def _record_call(self):
        """Record an API call to quota tracker."""
        if self.quota_tracker:
            remaining = self.quota_tracker.record_call()
            logger.info(f"API call recorded. {remaining} calls remaining today.")

    def _is_token_valid(self) -> bool:
        """Check if current token is still valid."""
        if not self._access_token or not self._token_expires_at:
            return False
        # Add buffer to refresh before actual expiry
        return datetime.now() < (self._token_expires_at - self.TOKEN_EXPIRY_BUFFER)

    async def authenticate(self) -> str:
        """
        Authenticate with PCGS API using OAuth2 password grant.

        Returns:
            Access token string

        Raises:
            AuthenticationError: If credentials are invalid or missing
        """
        self._check_credentials()

        if self._is_token_valid():
            logger.debug("Using cached valid token")
            return self._access_token

        logger.info("Authenticating with PCGS API...")

        url = f"{self.BASE_URL}/Authentication/GetToken"
        payload = {
            "userName": self.username,
            "password": self.password
        }

        try:
            response = await self._client.post(url, json=payload)

            if response.status_code == 401:
                raise AuthenticationError("Invalid PCGS credentials", status_code=401)

            response.raise_for_status()
            data = response.json()

            self._access_token = data.get("access_token") or data.get("token")

            # Parse token expiry (typically 24 hours for PCGS)
            expires_in = data.get("expires_in", 86400)  # Default 24 hours
            self._token_expires_at = datetime.now() + timedelta(seconds=expires_in)

            logger.info(f"Authentication successful. Token expires at {self._token_expires_at}")
            return self._access_token

        except httpx.HTTPStatusError as e:
            raise AuthenticationError(f"Authentication failed: {e}", status_code=e.response.status_code)
        except httpx.RequestError as e:
            raise PCGSApiError(f"Network error during authentication: {e}")

    async def _ensure_authenticated(self):
        """Ensure we have a valid token, refreshing if needed."""
        if not self._is_token_valid():
            await self.authenticate()

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make an authenticated API request with retry logic.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (without base URL)
            **kwargs: Additional arguments to pass to httpx

        Returns:
            JSON response as dict
        """
        await self._ensure_authenticated()
        self._check_quota()

        url = f"{self.BASE_URL}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"bearer {self._access_token}",
            **kwargs.pop("headers", {})
        }

        last_error = None
        for attempt in range(self.MAX_RETRIES):
            try:
                response = await self._client.request(
                    method, url, headers=headers, **kwargs
                )

                # Handle specific error codes
                if response.status_code == 401:
                    # Token expired, re-authenticate and retry
                    logger.warning("Token expired, re-authenticating...")
                    self._access_token = None
                    await self.authenticate()
                    headers["Authorization"] = f"bearer {self._access_token}"
                    continue

                if response.status_code == 429:
                    raise RateLimitError("Rate limit exceeded", status_code=429)

                response.raise_for_status()

                # Record successful call
                self._record_call()

                return response.json()

            except httpx.HTTPStatusError as e:
                last_error = e
                if e.response.status_code >= 500:
                    # Server error, retry with backoff
                    wait_time = self.RETRY_BACKOFF * (attempt + 1)
                    logger.warning(f"Server error {e.response.status_code}, retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    raise PCGSApiError(f"API error: {e}", status_code=e.response.status_code)

            except httpx.RequestError as e:
                last_error = e
                wait_time = self.RETRY_BACKOFF * (attempt + 1)
                logger.warning(f"Network error, retrying in {wait_time}s: {e}")
                await asyncio.sleep(wait_time)

        raise PCGSApiError(f"Request failed after {self.MAX_RETRIES} retries: {last_error}")

    async def get_coin_by_cert(self, cert_no: str) -> Dict[str, Any]:
        """
        Get coin data by certificate number.

        Args:
            cert_no: PCGS certificate number (7-8 digits)

        Returns:
            Coin data including price guide values
        """
        if not cert_no or not cert_no.isdigit():
            raise ValueError("cert_no must be a numeric string (7-8 digits)")

        logger.info(f"Fetching coin by cert number: {cert_no}")
        return await self._make_request(
            "GET",
            f"/coindetail/GetCoinFactsByCertNo/{cert_no}"
        )

    async def get_coin_by_pcgs_and_grade(self, pcgs_number: int, grade: str) -> Dict[str, Any]:
        """
        Get coin data by PCGS number and grade.

        Args:
            pcgs_number: PCGS catalog number
            grade: Grade string (e.g., "MS65", "PR70")

        Returns:
            Coin data for the specified grade
        """
        if not pcgs_number or pcgs_number < 1:
            raise ValueError("pcgs_number must be a positive integer")
        if not grade:
            raise ValueError("grade is required")

        logger.info(f"Fetching coin PCGS#{pcgs_number} in grade {grade}")
        return await self._make_request(
            "GET",
            f"/coindetail/GetCoinFactsByGrade",
            params={"PCGSNo": pcgs_number, "Grade": grade}
        )

    async def get_auction_prices(self, pcgs_number: int, grade: Optional[str] = None) -> Dict[str, Any]:
        """
        Get auction prices realized for a coin.

        Args:
            pcgs_number: PCGS catalog number
            grade: Optional grade filter

        Returns:
            Auction price history
        """
        params = {"PCGSNo": pcgs_number}
        if grade:
            params["Grade"] = grade

        logger.info(f"Fetching auction prices for PCGS#{pcgs_number}")
        return await self._make_request(
            "GET",
            "/auctionprices/GetAuctionPrices",
            params=params
        )
