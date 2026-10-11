import { expect, test } from "@playwright/test";

test("login page exposes the expected account recovery paths", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute("href", "/forgot-password");
  await expect(page.getByRole("link", { name: "Create your account" })).toHaveAttribute("href", "/signup");
});

test("password visibility changes immediately without submitting credentials", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("local-test-password");
  await page.getByLabel("Show password").check();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByLabel("Show password").uncheck();
  await expect(password).toHaveAttribute("type", "password");
});

test("forgot-password and invited-account pages remain publicly accessible", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByRole("link", { name: "Back to sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Create your account" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create your invited account" })).toBeVisible();
});

test("language switching translates the login page", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toBeVisible();
});
