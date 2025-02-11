const loginWith = async (page, username, password)  => {
  const button = page.getByRole('button', { name: 'login' })
  const usernameField = page.getByTestId('username')
  const passwordField = page.getByTestId('password')

  await button.click()
  await usernameField.fill(username)
  await passwordField.fill(password)
  await button.click()
}

const createBlog = async (page, title, author, url, content) => {
  const button = page.getByRole('button', { name: 'create new' })
  const titleField = page.getByTestId('title')
  const authorField = page.getByTestId('author')
  const urlField = page.getByTestId('url')
  const submitButton = page.getByRole('button', { name: 'create' })

  await button.click()
  await titleField.fill(title)
  await authorField.fill(author)
  await urlField.fill(url)
  await submitButton.click()
  await page.getByText(content).waitFor()
}

export { loginWith, createBlog }