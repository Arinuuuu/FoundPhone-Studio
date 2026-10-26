import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { compileStory } from "../src/story-engine/compiler";
import { defaultLayout } from "../src/launcher/layout";
async function open(page: Page, name: string) {
  await page
    .getByRole("button", { name: "打开App Store", exact: true })
    .click();
  await page.getByPlaceholder("搜索全部App").fill(name);
  await page
    .locator(".runtime-library-row")
    .filter({
      has: page.locator(".library-app-title strong", {
        hasText: new RegExp("^" + name + "$"),
      }),
    })
    .getByRole("button", { name: "打开", exact: true })
    .click();
  await expect(page.locator(".app-screen:not([inert])")).toHaveCSS(
    "transform",
    "none",
  );
}
test("old preview layouts cannot restore removed apps and store retains international apps", async ({
  page,
}) => {
  const w = compileStory(
    JSON.parse(readFileSync("stories/test-preview/story.json", "utf8")),
  ).work;
  const old = defaultLayout(w);
  old.previewLayoutRevision = 0;
  for (const id of ["wechat", "douyin"]) {
    const app = old.apps.find((a) => a.id === id)!;
    app.folder = "国内";
    app.installed = app.visible = true;
  }
  old.apps.find((a) => a.id === "instagram")!.folder = "国际";
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: "foundphone-layout-v1:" + w.id, value: JSON.stringify(old) },
  );
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await expect(page.locator(".lock-screen")).toHaveCount(0);
  await expect(page.locator('[data-home-key="wechat"]')).toHaveCount(0);
  await expect(page.locator('[data-home-key="douyin"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "打开文件夹国内", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "打开文件夹国际", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "打开App Store", exact: true })
    .click();
  for (const name of ["中国", "国内", "国际", "海外"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await page.getByRole("button", { name: "通讯", exact: true }).click();
  await expect(page.locator(".runtime-library-row").first()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await expect(page.locator('[data-home-key="wechat"]')).toHaveCount(0);
});
test("all player entries exclude mainland apps and retain international apps", async ({
  page,
}) => {
  for (const entry of ["/", "/?preview=test", "/?template=blank"]) {
    await page.goto(entry);
    await page.getByRole("button", { name: "轻触解锁" }).click();
    await page
      .getByRole("button", { name: "打开App Store", exact: true })
      .click();
    const search = page.getByPlaceholder("搜索全部App");
    for (const name of [
      "微信",
      "QQ",
      "微博",
      "小红书",
      "抖音",
      "哔哩哔哩",
      "支付宝",
      "淘宝",
      "网易云音乐",
    ]) {
      await search.fill(name);
      await expect(page.locator(".runtime-library-row")).toHaveCount(0);
    }
    for (const name of [
      "KakaoTalk",
      "Instagram",
      "YouTube",
      "TikTok",
      "WhatsApp",
    ]) {
      await search.fill(name);
      await expect(page.locator(".runtime-library-row")).toHaveCount(1);
    }
  }
});
test("X retains its own navigation", async ({ page }) => {
  await page.goto("/?preview=test");
  await page.getByRole("button", { name: "轻触解锁" }).click();
  await open(page, "X");
  await page.locator(".kzxx").first().click();
  await expect(page.locator(".x-detail-bottom button")).toHaveCount(5);
});
