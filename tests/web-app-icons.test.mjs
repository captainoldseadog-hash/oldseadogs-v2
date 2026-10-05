import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectDir = path.resolve(new URL("..", import.meta.url).pathname);

test("apple touch icon is an opaque 180px brand mark and the web manifest points at it", async () => {
  const touchIcon = await fs.readFile(path.join(projectDir, "public/apple-touch-icon.png"));
  assert.equal(touchIcon.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(touchIcon.readUInt32BE(16), 180);
  assert.equal(touchIcon.readUInt32BE(20), 180);
  assert.equal(touchIcon[24], 8);
  assert.equal(touchIcon[25], 2);

  const manifest = JSON.parse(await fs.readFile(path.join(projectDir, "public/site.webmanifest"), "utf8"));
  assert.equal(manifest.name, "Old Sea Dogs");
  assert.equal(manifest.short_name, "Old Sea Dogs");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.display, "browser");
  assert.equal(manifest.background_color, "#f6f7f3");
  assert.equal(manifest.theme_color, "#123944");
  assert.deepEqual(
    manifest.icons.map((icon) => [icon.src, icon.sizes, icon.type]),
    [
      ["/apple-touch-icon.png", "180x180", "image/png"],
      ["/favicon.png", "256x256", "image/png"],
    ],
  );

  const layout = await fs.readFile(path.join(projectDir, "app/layout.tsx"), "utf8");
  assert.match(layout, /url:\s*"\/apple-touch-icon\.png",\s*sizes:\s*"180x180"/);
  assert.match(layout, /manifest:\s*"\/site\.webmanifest"/);

  const proxy = await fs.readFile(path.join(projectDir, "proxy.ts"), "utf8");
  assert.match(proxy, /apple-touch-icon\.png/);
  assert.match(proxy, /site\.webmanifest/);
});
