from uuid import uuid4

import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

from app.settings import settings

s3 = boto3.client("s3", region_name=settings.aws_region)


def _parse_s3_url(url: str) -> tuple[str, str]:
    rest = url.removeprefix("s3://")
    bucket, _, key = rest.partition("/")
    if not bucket or not key:
        raise ValueError(f"Not an s3://bucket/key URL: {url!r}")
    return bucket, key


def upload_file(file: UploadFile) -> str:
    """Stream upload to S3; returns s3://bucket/key (stored on S3Document.url)."""
    key = f"documents/{uuid4()}/{file.filename or 'unnamed'}"
    file.file.seek(0)
    try:
        s3.upload_fileobj(
            file.file,
            settings.s3_bucket,
            key,
            ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
        )
    except ClientError as e:
        raise RuntimeError("S3 upload failed") from e
    return f"s3://{settings.s3_bucket}/{key}"


def delete_file(url: str) -> None:
    if not url.startswith("s3://"):
        return
    bucket, key = _parse_s3_url(url)
    try:
        s3.delete_object(Bucket=bucket, Key=key)
    except ClientError as e:
        raise RuntimeError("S3 delete failed") from e
