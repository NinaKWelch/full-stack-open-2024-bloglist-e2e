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
      await createBlog(page, 'first title', 'first author', 'first url')

      await expect(page.getByText('first title, by first author')).toBeVisible()
    })

    describe('and a blog exists', () => {
      beforeEach(async ({ page }) => {
        await createBlog(page, 'second title', 'second author', 'second url')
      })

      test('a blog can be liked', async ({ page }) => {
        const blog = page.getByText('second title, by second author')
        const showButton = blog.getByRole('button', { name: 'show' })
        const likes = blog.locator('..').getByText('likes')
        const likeButton = likes.getByRole('button', { name: 'like' })

        await showButton.click()
        
        await expect(likes).toBeVisible()
        await expect(likeButton).toBeVisible()

        await likeButton.click()

        await expect(likes).toContainText('1')
      })  
    })  
  })
})