import { mkdir, access, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants as fsConstants } from "node:fs";

const args = process.argv.slice(2);
const hasArg = (value) => args.includes(value);
const isForce = hasArg("--force") || hasArg("force");
const isPreview =
  hasArg("--preview") ||
  hasArg("--dry-run") ||
  hasArg("preview") ||
  hasArg("dry-run");
const scopeValues = new Set(["admin", "client"]);
const flagValues = new Set([
  "--force",
  "force",
  "--preview",
  "--dry-run",
  "preview",
  "dry-run",
]);
const positionalArgs = args.filter(
  (arg) => !arg.startsWith("--") && !flagValues.has(arg)
);

let scope = "client";
let moduleName = "";

if (positionalArgs.length >= 2 && scopeValues.has(positionalArgs[0])) {
  scope = positionalArgs[0];
  moduleName = positionalArgs[1];
} else if (positionalArgs.length >= 2 && scopeValues.has(positionalArgs[1])) {
  moduleName = positionalArgs[0];
  scope = positionalArgs[1];
} else if (positionalArgs.length >= 1) {
  moduleName = positionalArgs[0];
}

if (!moduleName) {
  console.error(
    "Usage: npm run gen:module -- <scope> <module-name> [force] [preview]\nScope: admin | client\nBackward compatible: npm run gen:module -- <module-name> ..."
  );
  process.exit(1);
}

if (!/^[a-zA-Z][a-zA-Z0-9-_]*$/.test(moduleName)) {
  console.error(
    "Invalid module name. Use letters, numbers, dash or underscore. Must start with a letter."
  );
  process.exit(1);
}

const normalizedName = moduleName.toLowerCase();
const projectRoot = process.cwd();
const moduleDir = path.join(projectRoot, "src", "modules", scope, normalizedName);

const toPascalCase = (value) =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const toCamelCase = (value) => {
  const pascal = toPascalCase(value);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const pascalName = toPascalCase(normalizedName);
const camelName = toCamelCase(normalizedName);

const files = [
  {
    name: `${normalizedName}.controller.js`,
    content: `import { ${camelName}Service } from "./${normalizedName}.service.js";

export const get${pascalName}Status = async (req, res, next) => {
  try {
    const data = await ${camelName}Service.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
`,
  },
  {
    name: `${normalizedName}.service.js`,
    content: `import { ${camelName}Repository } from "./${normalizedName}.repository.js";
import { to${pascalName}Response } from "./${normalizedName}.model.js";

class ${pascalName}Service {
  async getStatus() {
    const record = await ${camelName}Repository.getStatus();
    return to${pascalName}Response(record);
  }
}

export const ${camelName}Service = new ${pascalName}Service();
`,
  },
  {
    name: `${normalizedName}.repository.js`,
    content: `class ${pascalName}Repository {
  async getStatus() {
    // TODO: Replace with real DB query.
    return {
      id: 1,
      name: "${normalizedName}",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

export const ${camelName}Repository = new ${pascalName}Repository();
`,
  },
  {
    name: `${normalizedName}.model.js`,
    content: `// DTO formatter: only map data for API response.
// Replace fields below to match your module.
export const to${pascalName}Response = (record = {}) => ({
  id: record.id,
  name: record.name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const to${pascalName}ListResponse = (records = []) =>
  records.map((record) => to${pascalName}Response(record));
`,
  },
  {
    name: `${normalizedName}.routes.js`,
    content: `import { Router } from "express";
import { get${pascalName}Status } from "./${normalizedName}.controller.js";

const ${camelName}Router = Router();

${camelName}Router.get("/health", get${pascalName}Status);

export default ${camelName}Router;
`,
  },
  {
    name: "index.js",
    content: `export { default as ${camelName}Router } from "./${normalizedName}.routes.js";
export * from "./${normalizedName}.controller.js";
export * from "./${normalizedName}.service.js";
export * from "./${normalizedName}.repository.js";
export * from "./${normalizedName}.model.js";
`,
  },
];

const fileExists = async (filePath) => {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const run = async () => {
  if (!isPreview) {
    await mkdir(moduleDir, { recursive: true });
  }

  const createdFiles = [];
  const skippedFiles = [];

  for (const file of files) {
    const targetPath = path.join(moduleDir, file.name);
    const exists = await fileExists(targetPath);

    if (exists && !isForce) {
      skippedFiles.push(targetPath);
      continue;
    }

    if (!isPreview) {
      await writeFile(targetPath, file.content, "utf8");
    }

    createdFiles.push(targetPath);
  }

  if (isPreview) {
    console.log(`[PREVIEW] Module folder (${scope}): ${moduleDir}`);
  } else {
    console.log(`Module folder ready (${scope}): ${moduleDir}`);
  }

  if (createdFiles.length > 0) {
    console.log(isPreview ? "Would create/update files:" : "Created/updated files:");
    createdFiles.forEach((filePath) => console.log(`- ${filePath}`));
  }

  if (skippedFiles.length > 0) {
    console.log("Skipped existing files (use force to overwrite):");
    skippedFiles.forEach((filePath) => console.log(`- ${filePath}`));
  }
};

run().catch((error) => {
  console.error("Failed to create module:", error.message);
  process.exit(1);
});
