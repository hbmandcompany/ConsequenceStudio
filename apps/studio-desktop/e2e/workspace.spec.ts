import { test, expect } from "@playwright/test";

test("workspace loads after login", async ({ page }) => {
  await page.goto("http://localhost:1420/");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByPlaceholder("Username").fill("testuser");
  await page.getByPlaceholder("Password").fill("testpass");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.waitForURL("**/workspace**");
  await expect(page.getByText("Arrangement")).toBeVisible();
  await expect(page.getByText("Piano Roll")).toBeVisible();
});
