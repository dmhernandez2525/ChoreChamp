from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


@dataclass
class ChoreChampClient:
    api_key: Optional[str] = None
    access_token: Optional[str] = None
    base_url: str = "https://chorechamp-api-u0o9.onrender.com/api/public/v1"

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        else:
            raise ValueError("Either api_key or access_token must be provided")
        return headers

    def _request(self, method: str, path: str, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        response = requests.request(
            method,
            f"{self.base_url}{path}",
            headers=self._headers(),
            json=json_data,
            timeout=20,
        )
        if not response.ok:
            try:
                payload = response.json()
                message = payload.get("message", "Request failed")
            except Exception:
                message = "Request failed"
            raise RuntimeError(message)
        return response.json()

    def get_openapi(self) -> Dict[str, Any]:
        return self._request("GET", "/openapi.json")

    def list_household_chores(self, household_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/households/{household_id}/chores")

    def list_household_members(self, household_id: str) -> Dict[str, Any]:
        return self._request("GET", f"/households/{household_id}/members")

    def emit_event(self, household_id: str, event_type: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", f"/households/{household_id}/events/{event_type}", payload)
