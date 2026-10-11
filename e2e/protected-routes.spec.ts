import { expect, test } from "@playwright/test";

const protectedRoutes = ["/dashboard", "/activity", "/reports", "/reconciliations", "/settings"];

for (const route of protectedRoutes) {
  test(`anonymous visitors are redirected from ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("next") === route);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
}

test("the root route ultimately requires authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL((url) => url.pathname === "/login" && url.searchParams.get("next") === "/");
});
