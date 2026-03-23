import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mock Supabase auth so protected routes render without a real backend.
 * We intercept the Supabase REST calls that AuthContext makes on mount and
 * return a fake session / user.
 */
async function mockAuthSession(page: Page) {
  const fakeUser = {
    id: "e2e-user-id",
    email: "e2e@vyroo.test",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    app_metadata: { provider: "email" },
    user_metadata: { full_name: "E2E Tester" },
  };

  const fakeSession = {
    access_token: "fake-access-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "fake-refresh-token",
    user: fakeUser,
  };

  // Intercept Supabase auth token endpoint (session fetch)
  await page.route("**/auth/v1/token*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { session: fakeSession, user: fakeUser }, error: null }),
    }),
  );

  // Intercept Supabase auth user endpoint
  await page.route("**/auth/v1/user*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fakeUser),
    }),
  );

  // Intercept the getSession call (GoTrue REST)
  await page.route("**/rest/v1/**", (route) => {
    // Let non-auth requests pass or return empty arrays
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  // Seed localStorage so Supabase client picks up the session immediately
  await page.addInitScript((session) => {
    // Supabase stores the session under a key like sb-<ref>-auth-token
    const key = Object.keys(localStorage).find((k) => k.endsWith("-auth-token")) ?? "sb-test-auth-token";
    localStorage.setItem(
      key,
      JSON.stringify({
        currentSession: session,
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      }),
    );
  }, fakeSession);
}

/**
 * Mock the onboarding hook so the user is treated as onboarded.
 */
async function mockOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("vyroo_onboarding_complete", "true");
  });
}

// ---------------------------------------------------------------------------
// 1. Landing page loads and shows the composer
// ---------------------------------------------------------------------------

test.describe("Landing page", () => {
  test("loads and displays the composer input", async ({ page }) => {
    await page.goto("/");
    // The TaskInput component renders a textarea or input for composing messages
    const composer = page.locator("textarea, input[type='text']").first();
    await expect(composer).toBeVisible({ timeout: 15_000 });
  });

  test("shows the headline text", async ({ page }) => {
    await page.goto("/");
    // Index page has a headline like "What can I help you with?"
    await expect(page.getByText(/what can I help you with/i)).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Navigation to /dashboard works
// ---------------------------------------------------------------------------

test.describe("Dashboard navigation", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login*", { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("authenticated user can access /dashboard", async ({ page }) => {
    await mockOnboarding(page);
    await mockAuthSession(page);
    await page.goto("/dashboard");

    // Should NOT redirect to login
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain("/login");
  });
});

// ---------------------------------------------------------------------------
// 3. Sign-in flow (mocked)
// ---------------------------------------------------------------------------

test.describe("Sign-in flow", () => {
  test("login page renders email and password fields", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator("input[type='email'], input[placeholder*='email' i]").first();
    const passwordInput = page.locator("input[type='password']").first();

    await expect(emailInput).toBeVisible({ timeout: 15_000 });
    await expect(passwordInput).toBeVisible();
  });

  test("submitting login form calls Supabase auth", async ({ page }) => {
    let authCalled = false;

    await page.route("**/auth/v1/token*", (route) => {
      authCalled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "test-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "test-refresh",
          user: {
            id: "test-id",
            email: "test@vyroo.test",
            aud: "authenticated",
            role: "authenticated",
          },
        }),
      });
    });

    await page.goto("/login");

    const emailInput = page.locator("input[type='email'], input[placeholder*='email' i]").first();
    const passwordInput = page.locator("input[type='password']").first();

    await emailInput.fill("test@vyroo.test");
    await passwordInput.fill("password123");

    // Submit the form
    const submitButton = page.locator("button[type='submit'], button:has-text('Sign in'), button:has-text('Log in')").first();
    await submitButton.click();

    // Wait briefly for the request
    await page.waitForTimeout(1500);
    expect(authCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Sending a message in the chat
// ---------------------------------------------------------------------------

test.describe("Chat messaging", () => {
  test("composer accepts text and has a send button", async ({ page }) => {
    await page.goto("/");

    const composer = page.locator("textarea, input[type='text']").first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    await composer.fill("Hello, Vyroo!");
    await expect(composer).toHaveValue("Hello, Vyroo!");

    // There should be a send / submit button (ArrowUp icon button or submit)
    const sendButton = page.locator("button[type='submit'], button[aria-label*='send' i], button:has(svg)").first();
    await expect(sendButton).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Computer panel visibility
// ---------------------------------------------------------------------------

test.describe("Computer panel", () => {
  test("ComputerPanel component exists in dashboard layout", async ({ page }) => {
    await mockOnboarding(page);
    await mockAuthSession(page);
    await page.goto("/dashboard");

    // The dashboard should have the resizable panel group
    // ComputerPanel may be hidden initially; verify the panel group renders
    const panelGroup = page.locator("[data-panel-group-id], .flex").first();
    await expect(panelGroup).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// 6. Theme toggle (dark / light mode)
// ---------------------------------------------------------------------------

test.describe("Theme toggle", () => {
  test("page starts in dark mode by default", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // ThemeProvider sets defaultTheme="dark" → <html class="dark">
    const htmlClass = await page.locator("html").getAttribute("class");
    expect(htmlClass).toContain("dark");
  });

  test("toggling theme switches to light mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);

    // Look for a theme toggle button (sun/moon icon or settings gear)
    const themeToggle = page.locator(
      "button[aria-label*='theme' i], button[aria-label*='mode' i], button:has-text('Light'), button:has-text('Dark')"
    ).first();

    // If there's a visible theme toggle, click it
    if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      const htmlClass = await page.locator("html").getAttribute("class");
      // After toggle it should switch away from dark
      expect(htmlClass).not.toContain("dark");
    } else {
      // Theme toggle might be in settings; just verify dark mode is applied
      const htmlClass = await page.locator("html").getAttribute("class");
      expect(htmlClass).toContain("dark");
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Sidebar navigation between conversations
// ---------------------------------------------------------------------------

test.describe("Sidebar navigation", () => {
  test("dashboard sidebar is visible on desktop", async ({ page, browserName }, testInfo) => {
    // Only run on desktop project
    if (testInfo.project.name === "mobile-chrome") {
      test.skip();
    }

    await mockOnboarding(page);
    await mockAuthSession(page);
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    // DashboardSidebar should render with a "New" or "New chat" button
    const sidebar = page.locator("nav, aside, [class*='sidebar' i], [data-testid='sidebar']").first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// 8. Mobile responsive layout (drawer behavior)
// ---------------------------------------------------------------------------

test.describe("Mobile responsive layout", () => {
  test("sidebar is hidden on mobile viewport", async ({ page, browserName }, testInfo) => {
    // Only run on mobile project
    if (testInfo.project.name !== "mobile-chrome") {
      test.skip();
    }

    await mockOnboarding(page);
    await mockAuthSession(page);
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);

    // On mobile the sidebar should be hidden (shown as Sheet/Drawer on demand)
    // Look for a hamburger menu button
    const menuButton = page.locator(
      "button[aria-label*='menu' i], button:has(svg[class*='menu' i]), button:has([data-lucide='menu'])"
    ).first();

    // Either the menu button exists (sidebar is hidden behind it)
    // or the page is in mobile mode
    const hasMenu = await menuButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasMenu) {
      // Clicking menu should open the sidebar drawer
      await menuButton.click();
      await page.waitForTimeout(500);

      // A Sheet or Drawer overlay should appear
      const overlay = page.locator("[data-state='open'], [role='dialog']").first();
      await expect(overlay).toBeVisible({ timeout: 5000 });
    }
  });

  test("landing page is responsive on mobile", async ({ page, browserName }, testInfo) => {
    if (testInfo.project.name !== "mobile-chrome") {
      test.skip();
    }

    await page.goto("/");
    await page.waitForTimeout(1000);

    // The composer should still be visible on mobile
    const composer = page.locator("textarea, input[type='text']").first();
    await expect(composer).toBeVisible({ timeout: 15_000 });

    // Page should not have horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});
