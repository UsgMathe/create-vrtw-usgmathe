#!/usr/bin/env node

import { execa } from "execa";
import fs from "fs-extra";
import path from "path";
import pc from "picocolors";
import prompts from "prompts";
import { Project } from "ts-morph";

// --------------------
// Utils
// --------------------

const args = process.argv.slice(2);
const projectName = args.find((a) => !a.startsWith("-"));

const flags = {
  shadcn: !args.includes("--no-shadcn"),
  yes: args.includes("--yes"),
};

const isCI = process.env.CI === "true" || flags.yes;

function logStep(msg) {
  console.log(pc.cyan(`\n→ ${msg}`));
}

function handleError(step, err) {
  console.error(pc.red(`❌ Failed at: ${step}`));
  console.error(err);
  process.exit(1);
}

async function runCmd(cmd, args, options = {}) {
  try {
    return await execa(cmd, args, { stdio: "inherit", ...options });
  } catch (err) {
    handleError(`${cmd} ${args.join(" ")}`, err);
  }
}

// --------------------
// Validation
// --------------------

if (!projectName) {
  console.log(pc.red("❌ Please inform the project name."));
  process.exit(1);
}

if (!/^[a-z0-9-_]+$/i.test(projectName)) {
  console.log(pc.red("❌ Invalid project name"));
  process.exit(1);
}

const root = path.join(process.cwd(), projectName);

if (await fs.pathExists(root)) {
  console.log(pc.red("❌ Folder already exists"));
  process.exit(1);
}

// --------------------
// Package Manager
// --------------------

const ua = process.env.npm_config_user_agent || "";
const pkgManager = ua.includes("pnpm") ? "pnpm" : "npm";
const isPnpm = pkgManager === "pnpm";

console.log(pc.green(`📦 Using ${pkgManager}`));

// --------------------
// Steps
// --------------------

async function createVite() {
  logStep("Creating Vite app...");

  const subprocess = execa(
    isPnpm ? "pnpm" : "npm",
    isPnpm
      ? ["create", "vite@latest", projectName, "--template", "react-ts"]
      : ["create", "vite@latest", projectName, "--", "--template", "react-ts"],
    {
      stdio: ["pipe", "inherit", "inherit"],
    }
  );

  subprocess.stdin.write("n\n");
  subprocess.stdin.end();

  await subprocess;

  if (!(await fs.pathExists(root))) {
    throw new Error("Project folder was not created");
  }
}

async function cleanFiles() {
  logStep("Cleaning files...");

  await fs.remove(path.join(root, "src/App.css"));
  await fs.remove(path.join(root, "src/assets"));
  await fs.remove(path.join(root, "public"));

  await fs.writeFile(path.join(root, "README.md"), "");
}

async function updateMainTsx() {
  const filePath = path.join(root, "src/main.tsx");

  if (!(await fs.pathExists(filePath))) {
    throw new Error("main.tsx not found");
  }

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);

  sourceFile.getImportDeclarations().forEach((imp) => {
    if (imp.getModuleSpecifierValue().includes("./App")) {
      imp.remove();
    }
  });

  const hasImport = sourceFile
    .getImportDeclarations()
    .some((i) => i.getModuleSpecifierValue() === "./app.tsx");

  if (!hasImport) {
    sourceFile.addImportDeclaration({
      namedImports: ["App"],
      moduleSpecifier: "./app.tsx",
    });
  }

  await sourceFile.save();
}

async function setupApp() {
  logStep("Configuring App...");

  const oldPath = path.join(root, "src/App.tsx");
  const newPath = path.join(root, "src/app.tsx");

  if (await fs.pathExists(oldPath)) await fs.remove(oldPath);

  await fs.writeFile(
    newPath,
    `export function App() {
  return <p>Hello World!</p>;
}
`
  );

  await updateMainTsx();

  await fs.writeFile(path.join(root, "src/index.css"), `@import "tailwindcss";`);
}

async function installDeps() {
  logStep("Installing dependencies...");

  await runCmd(pkgManager, ["install"], { cwd: root });

  await runCmd(pkgManager, ["add", "tailwindcss", "@tailwindcss/vite"], {
    cwd: root,
  });
}

async function setupVite() {
  logStep("Configuring Vite...");

  const vitePath = path.join(root, "vite.config.ts");
  let content = await fs.readFile(vitePath, "utf-8");

  if (!content.includes("tailwindcss()")) {
    content = content.replace(
      /plugins:\s*\[(.*?)\]/,
      (_, p1) => `plugins: [${p1}, tailwindcss()]`
    );

    content = `import tailwindcss from '@tailwindcss/vite'\n${content}`;
  }

  if (!content.includes("alias")) {
    content = content.replace(
      "defineConfig({",
      `defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },`
    );
  }

  if (!content.includes("import path")) {
    content = `import path from 'path'\n${content}`;
  }

  await fs.writeFile(vitePath, content);
}

async function setupTsconfig() {
  logStep("Configuring tsconfig...");

  const update = async (file) => {
    const raw = await fs.readFile(file, "utf-8");

    const json = JSON.parse(
      raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
    );

    json.compilerOptions = {
      ...json.compilerOptions,
      paths: {
        "@/*": ["./src/*"],
      },
    };

    await fs.writeJson(file, json, { spaces: 2 });
  };

  await update(path.join(root, "tsconfig.json"));
  await update(path.join(root, "tsconfig.app.json"));
}

async function setupShadcn() {
  let shouldInstall = flags.shadcn;

  if (!isCI && flags.shadcn) {
    const res = await prompts({
      type: "confirm",
      name: "value",
      message: "Install shadcn/ui?",
      initial: true,
    });

    shouldInstall = res.value;
  }

  if (!shouldInstall) {
    console.log(pc.gray("⏭️ Skipping shadcn"));
    return;
  }

  logStep("Installing shadcn...");

  await runCmd(
    isPnpm ? "pnpm" : "npx",
    isPnpm
      ? ["dlx", "shadcn@latest", "init", "--template", "vite"]
      : ["shadcn@latest", "init", "--template", "vite"],
    { cwd: root }
  );
}

async function setupPrettier() {
  logStep("Configuring Prettier...");

  await runCmd(pkgManager, ["add", "-D", "prettier-plugin-tailwindcss"], {
    cwd: root,
  });

  await fs.writeJson(
    path.join(root, ".prettierrc.json"),
    {
      $schema: "https://json.schemastore.org/prettierrc",
      semi: true,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 120,
      tabWidth: 2,
      plugins: ["prettier-plugin-tailwindcss"],
    },
    { spaces: 2 }
  );

  await fs.writeFile(
    path.join(root, ".prettierignore"),
    `dist
node_modules`
  );
}

async function finalize() {
  await fs.appendFile(path.join(root, ".gitignore"), "\n*.env\n");

  console.log(pc.green("\n✅ Project created successfully!\n"));

  console.log(`
Next steps:

  cd ${projectName}
  ${pkgManager} run dev
`);
}

// --------------------
// Run
// --------------------

async function run() {
  await createVite();
  await cleanFiles();
  await setupApp();
  await installDeps();
  await setupVite();
  await setupTsconfig();
  await setupShadcn();
  await setupPrettier();
  await finalize();
}

run().catch((err) => {
  console.error(pc.red("❌ Fatal Error"));
  console.error(err);
  process.exit(1);
});