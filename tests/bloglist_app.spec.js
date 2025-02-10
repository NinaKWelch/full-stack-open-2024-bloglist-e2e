const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'John Doe',
        username: 'john',
        password: 'johnpw'
      }
    })

    await page.goto('/')
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
      await loginWith(page, 'john', 'johnpw')

      await expect(page.getByText('John Doe logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      const errorMessage = page.locator('.error')

      await loginWith(page, 'john', 'pw')

      await expect(page.getByText('John Doe logged in')).not.toBeVisible()
     
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toContainText('Wrong credentials')
      await expect(errorMessage).toHaveCSS('border-style', 'solid')
      await expect(errorMessage).toHaveCSS('color', 'rgb(255, 0, 0)')
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'john', 'johnpw')
    })
  
    test('a new blog can be created', async ({ page }) => {
      await createBlog(page, 'test blog title', 'test blog author', 'test blog url')

      await expect(page.getByText('test blog title, by test blog author')).toBeVisible()
    })
  })
})