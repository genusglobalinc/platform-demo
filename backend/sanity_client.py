import os
import requests
from dotenv import load_dotenv
from typing import List, Any

load_dotenv()

class SanityClient:
    """Light-weight wrapper around the Sanity HTTP API (v2021-10-21)."""

    def __init__(self):
        self.project_id: str | None = os.getenv("SANITY_PROJECT_ID")
        self.dataset: str = os.getenv("SANITY_DATASET", "production")
        self.token: str | None = os.getenv("SANITY_TOKEN")

        if not self.project_id or not self.token:
            raise EnvironmentError(
                "SANITY_PROJECT_ID / SANITY_TOKEN must be set in environment variables"
            )

        # Use the latest stable Sanity API version that supports mutations & queries
        self.base_url = f"https://{self.project_id}.api.sanity.io/v2021-10-21"

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    # ---------------------------------------------------------------------
    # Asset upload helpers
    # ---------------------------------------------------------------------
    def _upload_image(self, image_bytes: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload raw image bytes to Sanity and return the asset ID."""
        url = f"{self.base_url}/assets/images/{self.dataset}"
        headers = {**self._headers(), "Content-Type": content_type}
        resp = requests.post(url, data=image_bytes, headers=headers, timeout=20)
        if resp.status_code == 200:
            return resp.json().get("document", {}).get("_id")
        raise RuntimeError(f"Sanity image upload failed: {resp.text}")

    def upload_image_from_url(self, image_url: str) -> dict[str, Any]:
        """Download an image from a URL, upload to Sanity, and return an image reference dict."""
        dl_resp = requests.get(image_url, timeout=20)
        if dl_resp.status_code != 200:
            raise RuntimeError(f"Failed to download image from {image_url}: {dl_resp.status_code}")
        asset_id = self._upload_image(
            dl_resp.content,
            dl_resp.headers.get("Content-Type", "application/octet-stream"),
        )
        return {"_type": "image", "asset": {"_type": "reference", "_ref": asset_id}}

    def upload_image_bytes(self, image_bytes: bytes, content_type: str = "application/octet-stream") -> dict[str, Any]:
        """Upload raw image bytes and return a Sanity image reference dict."""
        asset_id = self._upload_image(image_bytes, content_type)
        return {"_type": "image", "asset": {"_type": "reference", "_ref": asset_id}}

    # ---------------------------------------------------------------------
    # Public CRUD helpers
    # ---------------------------------------------------------------------
    def create_document(self, doc_type: str, data: dict) -> str:
        """Create and return the Sanity document ID."""
        url = f"{self.base_url}/data/mutate/{self.dataset}"
        payload = {
            "mutations": [
                {
                    "create": {
                        "_type": doc_type,
                        **data,
                    }
                }
            ]
        }
        resp = requests.post(url, json=payload, headers=self._headers(), timeout=10)
        if resp.status_code == 200:
            res = resp.json()["results"][0]
            doc_id = res.get("id") or res.get("documentId")
            if doc_id:
                return doc_id
        raise RuntimeError(f"Sanity create_document failed: {resp.text}")

    def get_document(self, doc_id: str) -> Any:
        query = f'*[_id == "{doc_id}"][0]'
        results = self.query_documents(query)
        return results if results else None

    def query_documents(self, query: str) -> List[Any]:
        url = f"{self.base_url}/data/query/{self.dataset}"
        resp = requests.get(url, params={"query": query}, headers=self._headers(), timeout=10)
        if resp.status_code == 200:
            return resp.json().get("result", [])
        raise RuntimeError(f"Sanity query failed: {resp.text}")
