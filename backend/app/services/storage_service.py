"""
Backblaze B2 cloud storage service (S3-compatible API).

Provides a clean abstraction over boto3 so the rest of the application never
deals directly with S3 client calls or B2 credentials.
"""

import logging
import os
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.config import (
    B2_ACCESS_KEY_ID,
    B2_BUCKET_NAME,
    B2_ENDPOINT,
    B2_REGION,
    B2_SECRET_ACCESS_KEY,
)

logger = logging.getLogger(__name__)


class StorageService:
    """
    Thin wrapper around boto3 configured for Backblaze B2's S3-compatible endpoint.

    All methods raise ``RuntimeError`` for configuration errors and re-raise
    ``ClientError`` / ``BotoCoreError`` for B2-side problems so callers can
    handle them appropriately.
    """

    def __init__(self) -> None:
        if not all([B2_ENDPOINT, B2_BUCKET_NAME, B2_ACCESS_KEY_ID, B2_SECRET_ACCESS_KEY]):
            raise RuntimeError(
                "Backblaze B2 is not fully configured. "
                "Set B2_ENDPOINT, B2_BUCKET_NAME, B2_ACCESS_KEY_ID and "
                "B2_SECRET_ACCESS_KEY in your environment."
            )

        self._bucket = B2_BUCKET_NAME
        self._client = boto3.client(
            "s3",
            endpoint_url=B2_ENDPOINT,
            aws_access_key_id=B2_ACCESS_KEY_ID,
            aws_secret_access_key=B2_SECRET_ACCESS_KEY,
            region_name=B2_REGION,
        )
        logger.debug("StorageService initialised — bucket=%s endpoint=%s", self._bucket, B2_ENDPOINT)

    # ------------------------------------------------------------------
    # Public interface
    # ------------------------------------------------------------------

    def upload_file(
        self,
        local_path: str,
        object_key: str,
        content_type: Optional[str] = None,
    ) -> dict:
        """
        Upload a local file to B2.

        Args:
            local_path:   Absolute or relative path to the file on disk.
            object_key:   Destination key (path) inside the B2 bucket.
            content_type: MIME type (e.g. ``"application/pdf"``).

        Returns:
            Dict containing ``bucket``, ``object_key``, and ``etag`` (if returned).

        Raises:
            FileNotFoundError: If ``local_path`` does not exist.
            ClientError / BotoCoreError: On B2 API errors.
        """
        if not os.path.exists(local_path):
            raise FileNotFoundError(f"Local file not found: {local_path}")

        extra_args: dict = {}
        if content_type:
            extra_args["ContentType"] = content_type

        logger.info("Uploading to B2 — key=%s bucket=%s", object_key, self._bucket)

        try:
            response = self._client.upload_file(
                local_path,
                self._bucket,
                object_key,
                ExtraArgs=extra_args if extra_args else None,
            )
        except (ClientError, BotoCoreError) as exc:
            logger.error("B2 upload failed — key=%s error=%s", object_key, exc)
            raise

        # Retrieve ETag from a head-object call (upload_file returns None)
        etag: Optional[str] = None
        try:
            head = self._client.head_object(Bucket=self._bucket, Key=object_key)
            etag = head.get("ETag", "").strip('"')
        except Exception:
            pass  # ETag is informational; don't fail the whole upload

        logger.info("B2 upload successful — key=%s etag=%s", object_key, etag)
        return {"bucket": self._bucket, "object_key": object_key, "etag": etag}

    def download_file(self, object_key: str, local_path: str) -> None:
        """
        Download a B2 object to a local file path.

        Args:
            object_key: Key of the object inside the B2 bucket.
            local_path: Destination path on the local filesystem. Parent
                        directories will be created if they do not exist.

        Raises:
            ClientError / BotoCoreError: On B2 API errors.
        """
        os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)

        logger.info("Downloading from B2 — key=%s -> %s", object_key, local_path)
        try:
            self._client.download_file(self._bucket, object_key, local_path)
        except (ClientError, BotoCoreError) as exc:
            logger.error("B2 download failed — key=%s error=%s", object_key, exc)
            raise
        logger.info("B2 download successful — key=%s", object_key)

    def delete_file(self, object_key: str) -> None:
        """
        Delete an object from B2.

        Args:
            object_key: Key of the object to delete.

        Raises:
            ClientError / BotoCoreError: On B2 API errors.
        """
        logger.info("Deleting from B2 — key=%s bucket=%s", object_key, self._bucket)
        try:
            self._client.delete_object(Bucket=self._bucket, Key=object_key)
        except (ClientError, BotoCoreError) as exc:
            logger.error("B2 delete failed — key=%s error=%s", object_key, exc)
            raise
        logger.info("B2 delete successful — key=%s", object_key)

    def generate_presigned_get_url(
        self, object_key: str, expires_seconds: int = 600
    ) -> str:
        """
        Generate a short-lived pre-signed GET URL for a B2 object.

        Args:
            object_key:      Key of the object inside the B2 bucket.
            expires_seconds: Lifetime of the URL in seconds (default 10 min).

        Returns:
            Pre-signed URL string.

        Raises:
            ClientError / BotoCoreError: On B2 API errors.
        """
        logger.info(
            "Generating presigned URL — key=%s expires_seconds=%d",
            object_key,
            expires_seconds,
        )
        try:
            url = self._client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self._bucket, "Key": object_key},
                ExpiresIn=expires_seconds,
            )
        except (ClientError, BotoCoreError) as exc:
            logger.error("Presigned URL generation failed — key=%s error=%s", object_key, exc)
            raise
        return url
