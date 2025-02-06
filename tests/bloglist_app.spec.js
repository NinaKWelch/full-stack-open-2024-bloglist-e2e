const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'John Doe',
        username: 'john',
        password: 'johnpw'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('Front page can be opened', async ({ page }) => {
    const heading = page.getByText('Log in to application')

    await expect(heading).toBeVisible()
  })

  test('Login form is shown', async ({ page }) => {
    const button = page.getByRole('button', { name: 'login' })
    const usernameField = page.getByTestId('username')
    const passwordField = page.getByTestId('password')

    await button.click()

    await expect(usernameField).toBeVisible()
    await expect(passwordField).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      const button = page.getByRole('button', { name: 'login' })
      const usernameField = page.getByTestId('username')
      const passwordField = page.getByTestId('password')
  
      await button.click()
      await usernameField.fill('john')
      await passwordField.fill('johnpw')
      await button.click()

      await expect(page.getByText('John Doe logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      const button = page.getByRole('button', { name: 'login' })
      const usernameField = page.getByTestId('username')
      const passwordField = page.getByTestId('password')
      const errorMessage = page.locator('.error')
  
      await button.click()
      await usernameField.fill('john')
      await passwordField.fill('pw')
      await button.click()

      await expect(page.getByText('John Doe logged in')).not.toBeVisible()
     
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toContainText('Wrong credentials')
      await expect(errorMessage).toHaveCSS('border-style', 'solid')
      await expect(errorMessage).toHaveCSS('color', 'rgb(255, 0, 0)')
    })
  })
})