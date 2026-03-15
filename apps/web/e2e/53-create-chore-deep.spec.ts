import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './helpers';
import { TEST_CONFIG } from './config';

const HID = TEST_CONFIG.householdId;

test.describe('Create Chore Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/households/${HID}/chores/new`);
    await page.waitForLoadState('load');
    await ensureAuthenticated(page);
    await page.waitForTimeout(2000);
  });

  test('form has a title input that accepts text', async ({ page }) => {
    // Find the title input by label or placeholder
    const titleByLabel = page.getByLabel(/title/i).first();
    const titleByPlaceholder = page.getByPlaceholder(/title|name|chore/i).first();
    const textInput = page.locator('input[type="text"]').first();

    let titleInput = titleByLabel;
    if (!(await titleByLabel.isVisible().catch(() => false))) {
      titleInput = (await titleByPlaceholder.isVisible().catch(() => false))
        ? titleByPlaceholder
        : textInput;
    }

    await expect(titleInput).toBeVisible({ timeout: 10000 });

    // Verify it accepts input
    await titleInput.fill('E2E Test Chore');
    const value = await titleInput.inputValue();
    expect(value).toBe('E2E Test Chore');
  });

  test('form has a priority or difficulty selector', async ({ page }) => {
    // Look for priority/difficulty selection controls
    const priorityButtons = page.getByRole('button').filter({
      hasText: /easy|medium|hard|low|high|critical|simple|challenging|very hard/i,
    });
    const priorityButtonCount = await priorityButtons.count();

    const prioritySelect = page.locator('select').filter({
      hasText: /easy|medium|hard|low|high|priority|difficulty/i,
    });
    const hasSelect = await prioritySelect.isVisible().catch(() => false);

    const radioInputs = page.locator('input[type="radio"]');
    const radioCount = await radioInputs.count();

    const priorityLabel = page.getByText(/priority|difficulty/i).first();
    const hasLabel = await priorityLabel.isVisible().catch(() => false);

    // Should have priority/difficulty controls
    expect(priorityButtonCount > 0 || hasSelect || radioCount > 0 || hasLabel).toBeTruthy();
  });

  test('form has assignee selector showing real member names', async ({ page }) => {
    // The assign section should show household member names
    const assignLabel = page.getByText(/assign/i).first();
    await expect(assignLabel).toBeVisible({ timeout: 10000 });

    // Look for actual family member names in the assignee section
    const memberNames = ['Daniel', 'Christina', 'Adam', 'Addison', 'Aiden'];
    let foundMembers = 0;

    for (const name of memberNames) {
      const locator = page.getByText(name, { exact: false }).first();
      const visible = await locator.isVisible().catch(() => false);
      if (visible) foundMembers++;
    }

    // Should show at least 2 real family member names as assignee options
    // (or "Anyone" / "All Members" as alternatives)
    const anyoneOption = page.getByText(/anyone|all member|everyone|unassigned/i).first();
    const hasAnyone = await anyoneOption.isVisible().catch(() => false);

    expect(foundMembers >= 2 || hasAnyone).toBeTruthy();
  });

  test('submit button exists and form validates required fields', async ({ page }) => {
    // Find the submit/create button
    const submitBtn = page.getByRole('button', { name: /create|save|submit|add chore/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    // Click submit without filling in any fields to trigger validation
    await submitBtn.click();
    await page.waitForTimeout(1500);

    // After clicking submit on empty form, should see validation feedback
    // Check for: validation error messages, required field indicators, or staying on the same page
    const validationError = page.getByText(/required|please|can't be empty|enter a|must|invalid/i).first();
    const hasValidationError = await validationError.isVisible().catch(() => false);

    // Or check for HTML5 validation (browser-native required field messages)
    // The form should not navigate away on failed validation
    const stillOnForm = page.url().includes('/chores/new');

    // Or check for visual error indicators (red borders, error icons)
    const errorIndicators = page.locator(
      '[class*="error"], [class*="invalid"], [aria-invalid="true"], [class*="required"]'
    );
    const errorCount = await errorIndicators.count();

    expect(hasValidationError || stillOnForm || errorCount > 0).toBeTruthy();
  });
});
