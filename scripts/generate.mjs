/**
 * Scaffolding generator — creates code that follows the conventions in
 * .documentation/devdocs/organization.md so the canonical structure is the
 * path of least resistance.
 *
 * Usage:
 *   pnpm gen feature <name>   # web feature slice (apps/web/src/features/<name>)
 *   pnpm gen module <name>    # API domain module (apps/api/src/core/<name>)
 *   pnpm gen                  # interactive
 */
import { input, select } from '@inquirer/prompts';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPascalCase } from './lib/utils.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function validateName(name) {
  if (!name || name.length === 0) {
    return 'Name is required';
  }
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return 'Use kebab-case: lowercase letters, numbers, and hyphens (must start with a letter)';
  }
  return true;
}

function writeFile(relativePath, content) {
  const filePath = join(rootDir, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf8');
  console.log(`  created ${relativePath}`);
}

function prettify(relativePath) {
  execSync(`pnpm exec prettier --write "${relativePath}"`, { cwd: rootDir, stdio: 'ignore' });
}

// ---------------------------------------------------------------------------
// Web feature slice
// ---------------------------------------------------------------------------

function generateFeature(name) {
  const pascal = toPascalCase(name);
  const base = `apps/web/src/features/${name}`;

  if (existsSync(join(rootDir, base))) {
    console.error(`Feature "${name}" already exists at ${base}`);
    process.exit(1);
  }

  writeFile(
    `${base}/pages/${name}-page.tsx`,
    `export function ${pascal}Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">${pascal}</h1>
      </div>
    </div>
  );
}
`,
  );
  writeFile(`${base}/pages/index.ts`, `export { ${pascal}Page } from './${name}-page';\n`);
  writeFile(
    `${base}/services/index.ts`,
    `// Raw API calls for this feature. Each function wraps apiClient from @/lib/api-client
// and returns a typed promise, e.g.:
//   export function get${pascal}s(): Promise<${pascal}Response[]> {
//     return apiClient.get('/${name}s');
//   }
// Response/request types shared with the API belong in @starter/shared.
export {};
`,
  );
  writeFile(
    `${base}/queries/index.ts`,
    `// TanStack Query hooks for this feature. Queries wrap functions from ../services, e.g.:
//   export function use${pascal}s() {
//     return useQuery({ queryKey: ['${name}s'], queryFn: get${pascal}s });
//   }
export {};
`,
  );
  writeFile(
    `${base}/components/index.ts`,
    `// Feature-specific components (kebab-case files, PascalCase exports).
export {};
`,
  );
  writeFile(
    `${base}/index.ts`,
    `export * from './components';
export * from './pages';
export * from './queries';
export * from './services';
`,
  );

  // Register in the features barrel (kept alphabetically sorted)
  const barrelPath = join(rootDir, 'apps/web/src/features/index.ts');
  const lines = readFileSync(barrelPath, 'utf8').split('\n').filter(Boolean);
  lines.push(`export * from './${name}';`);
  writeFileSync(barrelPath, [...new Set(lines)].sort().join('\n') + '\n', 'utf8');
  console.log(`  updated apps/web/src/features/index.ts`);

  console.log(`
Feature "${name}" created. Next steps:
  1. Add a route in apps/web/src/main.tsx:
       <Route path="/${name}" element={<${pascal}Page />} />
  2. Put shared request/response types in packages/shared/src/types/
`);
}

// ---------------------------------------------------------------------------
// API domain module (core/)
// ---------------------------------------------------------------------------

function generateModule(name) {
  const pascal = toPascalCase(name);
  const base = `apps/api/src/core/${name}`;

  if (existsSync(join(rootDir, base))) {
    console.error(`Module "${name}" already exists at ${base}`);
    process.exit(1);
  }

  writeFile(
    `${base}/dto/index.ts`,
    `// class-validator DTOs, one action-named class per file, e.g.:
//   export { Create${pascal}Dto } from './create-${name}.dto.js';
export {};
`,
  );
  writeFile(
    `${base}/${name}.service.ts`,
    `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${pascal}Service {
  // Inject repos from src/database (e.g. constructor(private readonly ${toCamel(name)}Repo: ${pascal}Repo) {}).
  // Services never touch PrismaService directly for entity access — add a repo
  // under src/database/repos/${name}/ and register it in database.module.ts.
}
`,
  );
  writeFile(
    `${base}/${name}.controller.ts`,
    `import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${pascal}Service } from './${name}.service.js';

@ApiTags('${pascal}')
@Controller('${name}s')
export class ${pascal}Controller {
  constructor(private readonly ${toCamel(name)}Service: ${pascal}Service) {}
}
`,
  );
  writeFile(
    `${base}/${name}.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './${name}.controller.js';
import { ${pascal}Service } from './${name}.service.js';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`,
  );
  writeFile(
    `${base}/index.ts`,
    `export * from './dto/index.js';
export { ${pascal}Controller } from './${name}.controller.js';
export { ${pascal}Module } from './${name}.module.js';
export { ${pascal}Service } from './${name}.service.js';
`,
  );

  // Register in core.module.ts
  const corePath = join(rootDir, 'apps/api/src/core/core.module.ts');
  let core = readFileSync(corePath, 'utf8');
  const importLine = `import { ${pascal}Module } from './${name}/index.js';`;
  if (!core.includes(importLine)) {
    core = core.replace(
      /(import { Module } from '@nestjs\/common';\n)/,
      `$1${importLine}\n`,
    );
    core = core.replace(/imports: \[/, `imports: [${pascal}Module, `);
    writeFileSync(corePath, core, 'utf8');
    prettify('apps/api/src/core/core.module.ts');
    console.log(`  updated apps/api/src/core/core.module.ts`);
  }

  console.log(`
Module "${name}" created. Next steps:
  1. Add the entity to apps/api/prisma/schema.prisma and run pnpm db:migrate
  2. Add a repo under apps/api/src/database/repos/${name}/ and register it in database.module.ts
  3. Put shared request/response types in packages/shared/src/types/
`);
}

function toCamel(kebab) {
  const pascal = toPascalCase(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ---------------------------------------------------------------------------

async function main() {
  let [, , kind, name] = process.argv;

  if (!kind) {
    kind = await select({
      message: 'What do you want to generate?',
      choices: [
        { name: 'Web feature slice (apps/web/src/features)', value: 'feature' },
        { name: 'API domain module (apps/api/src/core)', value: 'module' },
      ],
    });
  }

  if (!['feature', 'module'].includes(kind)) {
    console.error(`Unknown generator "${kind}". Use: pnpm gen [feature|module] <name>`);
    process.exit(1);
  }

  if (!name) {
    name = await input({
      message: `Name for the new ${kind} (kebab-case):`,
      validate: validateName,
    });
  }

  const valid = validateName(name);
  if (valid !== true) {
    console.error(valid);
    process.exit(1);
  }

  if (kind === 'feature') {
    generateFeature(name);
  } else {
    generateModule(name);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
