import assert from "node:assert/strict";
import test from "node:test";

type Operation = {
  operationId?: string;
  meta?: {
    tags?: unknown;
    category?: unknown;
    provider?: unknown;
  };
};

type OpenApiDoc = {
  openapi?: string;
  paths?: Record<string, Record<string, Operation>>;
};

const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
  "head",
] as const;

const baseUrl = (process.env.NODES_BASE_URL || "http://localhost:3009").replace(
  /\/+$/,
  "",
);
const openApiUrl = `${baseUrl}/nodes/openapi.json`;
const strictContract = process.env.STRICT_OPENAPI_CONTRACT !== "0";

test("local nodes OpenAPI contract (live)", async () => {
  let response: Response;
  try {
    response = await fetch(openApiUrl);
  } catch (error) {
    assert.fail(
      `Cannot reach ${openApiUrl}. Start nodes service first (e.g. 'pnpm dev'). Error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  assert.ok(
    response.ok,
    `Expected 2xx from ${openApiUrl}, got ${response.status} ${response.statusText}`,
  );

  const spec = (await response.json()) as OpenApiDoc;
  assert.equal(spec.openapi, "3.1.0", "nodes spec must be OpenAPI 3.1.0");

  const paths = Object.entries(spec.paths || {});
  assert.ok(paths.length > 0, "nodes spec must expose at least one path");
  const missingOperationIds: string[] = [];
  const missingMetaFields: string[] = [];

  for (const [path, pathItem] of paths) {
    assert.ok(path.startsWith("/nodes/"), `Path must start with /nodes/: ${path}`);
    assert.ok(
      !path.startsWith("/nodes/llm/"),
      `Legacy proxy path should not exist: ${path}`,
    );
    assert.ok(
      !path.startsWith("/nodes/ytdl/"),
      `Legacy proxy path should not exist: ${path}`,
    );

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      if (
        !(typeof operation.operationId === "string" && operation.operationId.length > 0)
      ) {
        missingOperationIds.push(`${method.toUpperCase()} ${path}`);
      }

      const meta = operation.meta || {};
      if (!Array.isArray(meta.tags)) {
        missingMetaFields.push(`${method.toUpperCase()} ${path} -> meta.tags`);
      }
      if (!(typeof meta.category === "string" && meta.category.length > 0)) {
        missingMetaFields.push(`${method.toUpperCase()} ${path} -> meta.category`);
      }
      if (!(typeof meta.provider === "string" && meta.provider.length > 0)) {
        missingMetaFields.push(`${method.toUpperCase()} ${path} -> meta.provider`);
      }
    }
  }

  if (!strictContract) {
    if (missingOperationIds.length > 0) {
      console.warn(
        `[openapi-contract:live] Missing operationId on ${missingOperationIds.length} operations:\n` +
          missingOperationIds.join("\n"),
      );
    }
    if (missingMetaFields.length > 0) {
      console.warn(
        `[openapi-contract:live] Missing meta fields on ${missingMetaFields.length} operation fields:\n` +
          missingMetaFields.join("\n"),
      );
    }
    return;
  }

  assert.equal(
    missingOperationIds.length,
    0,
    `operationId is required for all operations. Missing:\n${missingOperationIds.join("\n")}`,
  );
  assert.equal(
    missingMetaFields.length,
    0,
    `meta.tags/category/provider are required for all operations. Missing:\n${missingMetaFields.join("\n")}`,
  );
});
