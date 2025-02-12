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
      const content = 'first title, by first author'
      const blog = page.getByText(content)
      const successMessage = page.locator('.success')

      await createBlog(page, 'first title', 'first author', 'https://first.com', content)

      await expect(blog).toBeVisible()

      await expect(successMessage).toBeVisible()
      await expect(successMessage).toContainText('A new blog first title by first author added')
      await expect(successMessage).toHaveCSS('border-style', 'solid')
      await expect(successMessage).toHaveCSS('color', 'rgb(0, 128, 0)')
    })

    test('a blog can be deleted', async ({ page }) => {
      page.on('dialog', async dialog => {
        await dialog.accept(); 
      });

      const content = 'second title, by second author'
      const blog = page.getByText(content)
      const successMessage = page.locator('.success')
      const showButton = blog.getByRole('button', { name: 'show' })
      const deleteButton = blog.locator('..').getByRole('button', { name: 'remove' })
     
      await createBlog(page, 'second title', 'second author', 'https://second.com', content)

      await showButton.click()

      await expect(deleteButton).toBeVisible()

      await deleteButton.click()

      await expect(blog).not.toBeVisible()
      await expect(successMessage).toBeVisible()
      await expect(successMessage).toContainText('Removed second title')
    })

    describe('and a blog exists', () => {
      const content = 'third title, by third author'

      beforeEach(async ({ page }) => {
        await createBlog(page, 'third title', 'third author', 'https://third.com', content)
      })

      test('a blog can be liked', async ({ page }) => {
        const blog = page.getByText(content)
        const successMessage = page.locator('.success')
        const showButton = blog.getByRole('button', { name: 'show' })
        const likes = blog.locator('..').getByText('likes')
        const likeButton = likes.getByRole('button', { name: 'like' })
     
        await showButton.click()
        
        await expect(likes).toBeVisible()
        await expect(likeButton).toBeVisible()

        await likeButton.click()

        await expect(likes).toContainText('1')
        await expect(successMessage).toBeVisible()
        await expect(successMessage).toContainText('Liked third title')
      })  

      test('only the creator can delete a blog', async ({ page, request }) => {
        const heading = page.getByText('Log in to application')
        const logoutButton = page.getByRole('button', { name: 'logout' })
        const loginButton = page.getByRole('button', { name: 'login' })
        const blog = page.getByText('third title, by third author')
        const blogCreator = blog.locator('..').getByText('john')
        const showButton = blog.getByRole('button', { name: 'show' })
        const deleteButton = blog.locator('..').getByRole('button', { name: 'remove' })

        await logoutButton.click()

        await expect(heading).toBeVisible()
        await expect(loginButton).toBeVisible()

        await loginButton.click()

        await request.post('/api/users', {
          data: {
            name: 'Jane Doe',
            username: 'jane',
            password: 'janepw'
          }
        })
        
        await loginWith(page, 'jane', 'janepw')

        await expect(blog).toBeVisible()

        await showButton.click()

        await expect(blogCreator).toBeVisible()
        await expect(deleteButton).not.toBeVisible()
      })
    })

    describe('and several blogs exists', () => {
      const contentA = 'forth title, by forth author'
      const contentB = 'fifth title, by fifth author'
      const contentC = 'sixth title, by sixth author'

      beforeEach(async ({ page }) => {
        await createBlog(page, 'forth title', 'forth author', 'https://forth.com', contentA)
        await createBlog(page, 'fifth title', 'fifth author', 'https://fifth.com', contentB)
        await createBlog(page, 'sixth title', 'sixth author', 'https://sixth.com', contentC)
      })

      test('blogs are ordered by likes', async ({ page }) => {
        const blogs = page.getByTestId('blogs').locator('div')
        const showButtons = page.getByRole('button', { name: 'show' })
        const successMessage = page.locator('.success')
        const likes = page.getByText('likes')
        const likeButton = likes.getByRole('button', { name: 'like' })
        const hideButton = page.getByRole('button', { name: 'hide' }) 

        await expect(blogs.locator('nth=0')).toContainText(contentA)

        await showButtons.locator('nth=1').click()

        await expect(likes).toBeVisible()
        await expect(likes).toContainText('0')
        await expect(likeButton).toBeVisible()
        await expect(hideButton).toBeVisible()

        await likeButton.click()

        await expect(likes).toContainText('1')
        await expect(successMessage).toBeVisible()
        await expect(successMessage).toContainText('Liked fifth title')

        await expect(blogs.locator('nth=0')).toContainText(contentB)

        await hideButton.click()
        await showButtons.locator('nth=2').click()

        await expect(likes).toBeVisible()
        await expect(likes).toContainText('0')
        await expect(likeButton).toBeVisible()

        await likeButton.click()

        await expect(likes).toContainText('1')
        
        await likeButton.click()

        await expect(likes).toContainText('2')
        await expect(blogs.locator('nth=0')).toContainText(contentC)
      })
    })  
  })
})