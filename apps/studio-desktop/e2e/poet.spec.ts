import { test, expect } from "@playwright/test";

test.describe("Poet panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByPlaceholder("Username").fill("poet-user");
    await page.getByPlaceholder("Password").fill("password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("Arrangement")).toBeVisible({ timeout: 15_000 });
  });

  test("renders Poet tab in right panel", async ({ page }) => {
    await page.getByRole("button", { name: "Poet" }).click();
    await expect(page.getByRole("button", { name: "Generate" })).toBeVisible();
    await expect(page.getByText("Generate lyrics to begin streaming.")).toBeVisible();
  });

  test("command palette lists Poet commands", async ({ page }) => {
    const isMac = process.platform === "darwin";
    await page.keyboard.press(isMac ? "Meta+KeyK" : "Control+KeyK");
    await page.getByPlaceholder("Type a command…").fill("Poet");
    await expect(page.getByText("Generate Verse")).toBeVisible();
    await expect(page.getByText("Toggle Poet Panel")).toBeVisible();
  });
});
