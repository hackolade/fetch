const { copyFile, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

/**
 * Converts the given root-relative path to a dist-relative path.
 * e.g. './dist/esm/index.mjs' becomes './esm/index.mjs'
 */
function toDistRelativePath(rootRelativePath) {
  if (!rootRelativePath) {
    throw new Error(`Expecting a truthy root-relative path, got ${rootRelativePath}!`);
  }
  if (path.isAbsolute(rootRelativePath)) {
    throw new Error(`Expecting a root-relative path, got an absolute path: ${rootRelativePath}!`);
  }
  const rootRelativeDistPath = `./${path.relative(rootDir, distDir)}`;
  if (!rootRelativePath.startsWith(rootRelativeDistPath)) {
    throw new Error(
      `The content of ${rootRelativePath} is not included in the ${path.basename(distDir)} folder and will be missing on NPM!`,
    );
  }
  return `./${path.relative(distDir, rootRelativePath)}`;
}

/**
 * Returns the package object to publish to NPM.
 */
async function getPackage() {
  const raw = await readFile(path.join(rootDir, 'package.json'), { encoding: 'utf-8' });
  const parsed = JSON.parse(raw);
  return {
    name: parsed.name,
    version: parsed.version,
    description: parsed.description,
    main: toDistRelativePath(parsed.main),
    module: toDistRelativePath(parsed.module),
    exports: {
      '.': {
        import: toDistRelativePath(parsed.exports['.'].import),
        require: toDistRelativePath(parsed.exports['.'].require),
      },
    },
    types: toDistRelativePath(parsed.types),
    dependencies: parsed.dependencies || {},
  };
}

/**
 * Generates the file package.json that will be published.
 */
async function generatePackageFile() {
  const pkg = await getPackage();
  await writeFile(path.join(distDir, 'package.json'), JSON.stringify(pkg, null, '  '));
}

/**
 * Prepares the publishing of this library to the NPM registry.
 */
async function preparePublishingToNPM() {
  await generatePackageFile();
  await copyFile(path.join(srcDir, 'index.d.ts'), path.join(distDir, 'index.d.ts'));
}

preparePublishingToNPM();
