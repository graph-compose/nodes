import json
import os
import sys
import urllib.error
import urllib.request


HTTP_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}


def fail(message: str) -> None:
    print(f"[openapi-contract:live] FAIL: {message}")
    sys.exit(1)


def main() -> None:
    base_url = os.environ.get("PYTHON_SERVICE_BASE_URL", "http://localhost:8090").rstrip(
        "/"
    )
    strict = os.environ.get("STRICT_OPENAPI_CONTRACT", "1") != "0"
    openapi_url = f"{base_url}/openapi.json"

    try:
        with urllib.request.urlopen(openapi_url, timeout=8) as response:
            if response.status < 200 or response.status >= 300:
                fail(
                    f"Expected 2xx from {openapi_url}, got {response.status} {response.reason}"
                )
            spec = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as error:
        fail(
            f"Cannot reach {openapi_url}. Start python service first "
            f"(e.g. uvicorn src.app:app --reload --port 8090). Error: {error}"
        )

    servers = spec.get("servers", [])
    if not servers or not isinstance(servers, list):
        fail("servers[0].url is required")
    server_url = (servers[0] or {}).get("url")
    if not isinstance(server_url, str) or not server_url.startswith(("http://", "https://")):
        fail("servers[0].url must be an absolute http(s) URL")

    paths = spec.get("paths", {})
    if not isinstance(paths, dict) or len(paths) == 0:
        fail("paths must be a non-empty object")

    missing_operation_ids: list[str] = []
    missing_x_meta: list[str] = []

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method not in HTTP_METHODS or not isinstance(operation, dict):
                continue

            operation_name = f"{method.upper()} {path}"

            operation_id = operation.get("operationId")
            if not isinstance(operation_id, str) or len(operation_id.strip()) == 0:
                missing_operation_ids.append(operation_name)

            x_meta = operation.get("x-meta")
            if not isinstance(x_meta, dict):
                missing_x_meta.append(f"{operation_name} -> x-meta")
                continue

            tags = x_meta.get("tags")
            category = x_meta.get("category")
            provider = x_meta.get("provider")

            if not isinstance(tags, list):
                missing_x_meta.append(f"{operation_name} -> x-meta.tags")
            if not isinstance(category, str) or len(category.strip()) == 0:
                missing_x_meta.append(f"{operation_name} -> x-meta.category")
            if not isinstance(provider, str) or len(provider.strip()) == 0:
                missing_x_meta.append(f"{operation_name} -> x-meta.provider")

    if strict:
        if missing_operation_ids:
            fail(
                "operationId is required for all operations. Missing:\n"
                + "\n".join(missing_operation_ids)
            )
        if missing_x_meta:
            fail(
                "x-meta.tags/category/provider are required for all operations. Missing:\n"
                + "\n".join(missing_x_meta)
            )
        print("[openapi-contract:live] PASS (strict)")
        return

    if missing_operation_ids:
        print(
            "[openapi-contract:live] WARN: missing operationIds:\n"
            + "\n".join(missing_operation_ids)
        )
    if missing_x_meta:
        print(
            "[openapi-contract:live] WARN: missing x-meta fields:\n"
            + "\n".join(missing_x_meta)
        )
    print("[openapi-contract:live] PASS (non-strict)")


if __name__ == "__main__":
    main()
