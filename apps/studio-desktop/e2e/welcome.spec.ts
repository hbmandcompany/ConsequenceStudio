import { test, expect } from "@playwright/test";

test("welcome screen renders", async ({ page }) => {
  await page.goto("http://localhost:1420/");
  await expect(page.getByText("ConsequenceStudio")).toBeVisible();
});
