// The join nothing typechecks: every `uniform` a shader declares against the
// `uniforms` of the material that compiles it. A missing entry is silently 0.
import { readFileSync } from 'node:fs';

const src = readFileSync(process.argv[2], 'utf8');

// const NAME = /* glsl */ `...`;
const shaders = new Map();
for (const m of src.matchAll(/const (\w+) = \/\* glsl \*\/ `([\s\S]*?)`;/g)) {
  const names = [...m[2].matchAll(/^\s*uniform\s+\w+\s+(\w+)/gm)].map((u) => u[1]);
  shaders.set(m[1], new Set(names));
}

// export function createXMaterial() { ... vertexShader: a, fragmentShader: b ... uniforms: { ... } }
const factories = [...src.matchAll(/export function (create\w*Material)\(\)\s*\{([\s\S]*?)\n\}/g)];

let bad = 0;
const seen = [];

for (const [, name, body] of factories) {
  const vs = body.match(/vertexShader:\s*(\w+)/);
  const fs = body.match(/fragmentShader:\s*(\w+)/);
  if (!vs || !fs) continue;

  const block = body.match(/uniforms:\s*\{([\s\S]*?)\n\s{4}\},/);
  const supplied = new Set(
    block ? [...block[1].matchAll(/^\s{6}(\w+):/gm)].map((u) => u[1]) : [],
  );

  const declared = new Set([...(shaders.get(vs[1]) ?? []), ...(shaders.get(fs[1]) ?? [])]);
  const missing = [...declared].filter((u) => !supplied.has(u));
  const spare = [...supplied].filter((u) => !declared.has(u));

  seen.push(name);
  if (missing.length) { bad++; console.log(`  MISSING ${name}: ${missing.join(', ')}`); }
  if (spare.length) console.log(`  unused  ${name}: ${spare.join(', ')}`);
}

// Materials built by wrapping another one carry its uniforms, so they are
// covered by the factory they call — but a typo in the override is not.
for (const m of src.matchAll(/export function (create\w+)\(\)\s*\{\s*const material = (create\w+)\(\);([\s\S]*?)\n\}/g)) {
  const parent = shaders.get(m[2]);
  for (const u of m[3].matchAll(/material\.uniforms\.(\w+)\.value/g)) {
    const vs = src.match(new RegExp(`function ${m[2]}\\(\\)[\\s\\S]*?vertexShader:\\s*(\\w+)`));
    const fs = src.match(new RegExp(`function ${m[2]}\\(\\)[\\s\\S]*?fragmentShader:\\s*(\\w+)`));
    const declared = new Set([...(shaders.get(vs?.[1]) ?? []), ...(shaders.get(fs?.[1]) ?? [])]);
    if (!declared.has(u[1])) { bad++; console.log(`  MISSING ${m[1]} overrides ${u[1]}, which ${m[2]} has no uniform for`); }
  }
  void parent;
}

console.log(`${factories.length} materials, ${shaders.size} shaders, ${bad} broken joins`);
console.log(seen.join(' '));
process.exit(bad ? 1 : 0);
