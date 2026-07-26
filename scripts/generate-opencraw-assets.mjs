#!/usr/bin/env node

import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRastermill } from "rastermill";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.join(rootDir, "docs/assets/opencraw");

const assets = [
  {
    source: "opencraw-crawcraw-source.png",
    outputs: [],
    pngSize: [1024, 1536],
    derivatives: [
      {
        output: "ui/public/opencraw-pwa-192.png",
        pngSize: [192, 192],
      },
      {
        output: "ui/public/opencraw-pwa-512.png",
        pngSize: [512, 512],
      },
    ],
  },
  {
    source: "opencraw-wordmark.png",
    outputs: [],
    pngSize: [1768, 363],
  },
  {
    source: "opencraw-mark-180.png",
    outputs: ["ui/public/opencraw-mark.png", "ui/public/apple-touch-icon.png"],
    pngSize: [180, 180],
  },
  {
    source: "opencraw-mark-32.png",
    outputs: ["ui/public/favicon-32.png"],
    pngSize: [32, 32],
  },
  {
    source: "opencraw-favicon.ico",
    outputs: ["ui/public/favicon.ico"],
    icoSizes: [16, 32, 48, 64, 128, 256],
  },
];

const rastermill = createRastermill({
  execution: "internal",
  limits: {
    inputPixels: 2_000_000,
    outputPixels: 400_000,
  },
});

function readPngSize(bytes, file) {
  const pngSignature = "89504e470d0a1a0a";
  if (bytes.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`${file} is not a PNG`);
  }
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function readIcoSizes(bytes, file) {
  if (bytes.readUInt16LE(0) !== 0 || bytes.readUInt16LE(2) !== 1) {
    throw new Error(`${file} is not an ICO`);
  }
  const count = bytes.readUInt16LE(4);
  if (bytes.length < 6 + count * 16) {
    throw new Error(`${file} has a truncated ICO directory`);
  }
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    const width = bytes[offset] || 256;
    const height = bytes[offset + 1] || 256;
    if (width !== height) {
      throw new Error(`${file} contains a non-square ${width}x${height} icon`);
    }
    return width;
  });
}

function assertArrayEquals(actual, expected, file) {
  if (
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    throw new Error(`${file} has ${actual.join(",")}; expected ${expected.join(",")}`);
  }
}

async function readValidatedSource(asset) {
  const sourcePath = path.join(sourceDir, asset.source);
  const bytes = await fs.readFile(sourcePath);
  if (asset.pngSize) {
    assertArrayEquals(readPngSize(bytes, asset.source), asset.pngSize, asset.source);
  }
  if (asset.icoSizes) {
    assertArrayEquals(readIcoSizes(bytes, asset.source), asset.icoSizes, asset.source);
  }
  return { bytes, sourcePath };
}

async function pathExists(file) {
  try {
    await fs.access(file, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function run({ check }) {
  const stale = [];
  for (const asset of assets) {
    const { bytes, sourcePath } = await readValidatedSource(asset);
    for (const output of asset.outputs) {
      const outputPath = path.join(rootDir, output);
      if (check) {
        if (!(await pathExists(outputPath))) {
          stale.push(`${output} is missing`);
          continue;
        }
        const outputBytes = await fs.readFile(outputPath);
        if (!bytes.equals(outputBytes)) {
          stale.push(`${output} differs from ${path.relative(rootDir, sourcePath)}`);
        }
        continue;
      }
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.copyFile(sourcePath, outputPath);
      console.log(`generated ${output}`);
    }
    for (const derivative of asset.derivatives ?? []) {
      const [width, height] = derivative.pngSize;
      const encoded = await rastermill.encode(bytes, {
        format: "png",
        compressionLevel: 9,
        metadata: "strip",
        resize: {
          enlarge: false,
          fit: "cover",
          width,
          height,
        },
      });
      assertArrayEquals([encoded.width, encoded.height], derivative.pngSize, derivative.output);
      const outputPath = path.join(rootDir, derivative.output);
      if (check) {
        if (!(await pathExists(outputPath))) {
          stale.push(`${derivative.output} is missing`);
          continue;
        }
        const outputBytes = await fs.readFile(outputPath);
        if (!encoded.data.equals(outputBytes)) {
          stale.push(`${derivative.output} differs from the deterministic source transform`);
        }
        continue;
      }
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, encoded.data);
      console.log(`generated ${derivative.output}`);
    }
  }
  if (stale.length > 0) {
    throw new Error(`OpenCraw assets are stale:\n- ${stale.join("\n- ")}`);
  }
  if (check) {
    console.log("OpenCraw generated assets are current and valid.");
  }
}

const args = new Set(process.argv.slice(2));
const check = args.has("--check");
if ([...args].some((arg) => arg !== "--check")) {
  console.error("usage: generate-opencraw-assets.mjs [--check]");
  process.exit(2);
}

run({ check }).catch((/** @type {unknown} */ error) => {
  console.error(
    `[opencraw-assets] FAILED (exit 1): ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
