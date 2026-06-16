import { test, expect } from "@playwright/test";

test("redesign surfaces work without runtime errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.route("**/chat", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/x-ndjson",
      body: '{"type":"token","text":"Analysis from conductor."}\n{"type":"done"}\n',
    });
  });

  await page.goto("http://localhost:1420/");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByPlaceholder("Username").fill("producer");
  await page.getByPlaceholder("Password").fill("pw");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/workspace**");

  await expect(page.getByText("Arrangement")).toBeVisible();
  await expect(page.getByText("Piano Roll")).toBeVisible();
  await expect(page.getByText("Tracks")).toBeVisible();
  await expect(page.getByText("Quantize")).toBeVisible();

  await page.getByPlaceholder(/Message/).fill("what key am i in?");
  await page.getByPlaceholder(/Message/).press("Enter");
  await expect(page.getByText("Analysis from conductor.")).toBeVisible();

  await page.getByTitle("Profile · Assistant").click();
  await expect(page.getByPlaceholder(/Message/)).toHaveCount(0);
  await page.getByTitle("Profile · Assistant").click();
  await expect(page.getByPlaceholder(/Message/)).toBeVisible();

  await page.getByTitle("Collaboration").click();
  await expect(page.getByText("Collaborators")).toBeVisible();

  expect(pageErrors, `page errors: ${pageErrors.join("\n")}`).toEqual([]);
});
