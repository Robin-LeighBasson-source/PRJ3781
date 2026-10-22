import assert from 'node:assert/strict'
import test, { after } from 'node:test'
import { PASSWORD, startTestServer } from '../testing/harness.js'

const { request, signup, stop } = await startTestServer()
after(stop)

const as = (account) => ({ cookie: account.cookie, csrfToken: account.csrfToken })

const JOB = { title: 'Junior analyst', location: 'Pretoria', description: 'Help the data team.' }
const BRIEF = {
  title: 'Landing page for open day',
  department: 'Information Systems',
  category: 'Web Development',
  description: 'Build a simple landing page for the campus open day.',
}

async function postJob(employer) {
  const response = await request(`/api/organizations/${employer.user.organizations[0].id}/jobs`, {
    method: 'POST',
    ...as(employer),
    body: { job: JOB, publish: true },
  })
  assert.equal(response.status, 201)
  return response.json()
}

async function postProject(employer) {
  const response = await request('/api/product-requests', { method: 'POST', ...as(employer), body: BRIEF })
  assert.equal(response.status, 201)
  return response.json()
}

async function overview(account) {
  const response = await request('/api/account', { cookie: account.cookie })
  assert.equal(response.status, 200)
  return response.json()
}

function deleteAccount(account, password = PASSWORD) {
  return request('/api/account', { method: 'DELETE', ...as(account), body: { password } })
}

test('the profile shows a candidate their own details, resume, portfolio and applications', async () => {
  assert.equal((await request('/api/account')).status, 401)

  const employer = await signup('employer')
  const candidate = await signup('candidate', { displayName: 'Thandi Nkosi' })
  const job = await postJob(employer)
  const project = await postProject(employer)

  await request('/api/candidate/resume', {
    method: 'PUT',
    ...as(candidate),
    body: { profile: { institution: 'Belgium Campus' }, visibleToEmployers: true },
  })
  await request('/api/candidate/resume/file', {
    method: 'PUT',
    ...as(candidate),
    headers: { 'x-file-name': 'cv.pdf' },
    body: Buffer.from('%PDF-1.7\n'),
  })
  await request(`/api/jobs/${job.id}/apply`, { method: 'POST', ...as(candidate) })
  await request(`/api/product-requests/${project.id}/apply`, { method: 'POST', ...as(candidate) })

  const data = await overview(candidate)
  assert.equal(data.account.displayName, 'Thandi Nkosi')
  assert.equal(data.account.email, candidate.user.email)
  assert.equal(data.account.accountType, 'candidate')
  assert.equal(data.resume.profile.institution, 'Belgium Campus')
  assert.equal(data.resume.visibleToEmployers, true)
  assert.equal(data.resume.file.fileName, 'cv.pdf')
  assert.equal(data.portfolio, null)
  assert.deepEqual(data.applications.map(({ kind, id }) => ({ kind, id })).sort((a, b) => a.kind.localeCompare(b.kind)), [
    { kind: 'job', id: job.id },
    { kind: 'project', id: project.id },
  ])

  const employerData = await overview(employer)
  assert.equal(employerData.account.accountType, 'employer')
  assert.equal(employerData.organizations[0].role, 'owner')
  assert.equal(employerData.organizations[0].deletedWithAccount, true)
})

test('deleting an account needs the password and the csrf token', async () => {
  const candidate = await signup('candidate')
  assert.equal((await request('/api/account', { method: 'DELETE', cookie: candidate.cookie, body: { password: PASSWORD } })).status, 403)
  assert.equal((await deleteAccount(candidate, 'wrong password')).status, 401)
  assert.equal((await deleteAccount(candidate, null)).status, 401)
  assert.equal((await request('/api/auth/me', { cookie: candidate.cookie }).then((r) => r.json())).user.id, candidate.user.id)
})

test('deleting a candidate removes their resume, portfolio, applications and sessions', async () => {
  const employer = await signup('employer')
  const candidate = await signup('candidate', { displayName: 'Sipho Dlamini' })
  const job = await postJob(employer)
  const project = await postProject(employer)

  await request('/api/candidate/resume/file', {
    method: 'PUT',
    ...as(candidate),
    headers: { 'x-file-name': 'cv.pdf' },
    body: Buffer.from('%PDF-1.7\n'),
  })
  const portfolio = await (await request('/api/candidate/portfolio', { cookie: candidate.cookie })).json()
  await request('/api/candidate/portfolio', {
    method: 'PUT',
    ...as(candidate),
    body: { portfolio: { ...portfolio.portfolio, published: true } },
  })
  assert.equal((await request(`/api/portfolios/${portfolio.portfolio.slug}`)).status, 200)
  await request(`/api/jobs/${job.id}/apply`, { method: 'POST', ...as(candidate) })
  await request(`/api/product-requests/${project.id}/apply`, { method: 'POST', ...as(candidate) })

  const deleted = await deleteAccount(candidate)
  assert.equal(deleted.status, 204)
  assert.match(deleted.headers.get('set-cookie'), /Max-Age=0/)

  assert.equal((await request('/api/auth/me', { cookie: candidate.cookie }).then((r) => r.json())).user, null)
  assert.equal((await request('/api/account', { cookie: candidate.cookie })).status, 401)
  assert.equal((await request(`/api/portfolios/${portfolio.portfolio.slug}`)).status, 404)

  const login = await request('/api/auth/login', { method: 'POST', body: { email: candidate.user.email, password: PASSWORD } })
  assert.equal(login.status, 401)

  const jobs = await (await request(`/api/organizations/${employer.user.organizations[0].id}/jobs`, { cookie: employer.cookie })).json()
  assert.equal(jobs.find((item) => item.id === job.id).applicantCount, 0)
  const projectView = await (await request(`/api/product-requests/${project.id}`, { cookie: employer.cookie })).json()
  assert.equal(projectView.applicantCount, 0)

  // The email can be used for a new account afterwards.
  await signup('candidate', { email: candidate.user.email })
})

test('deleting the only owner of a company deletes the company and its jobs and projects', async () => {
  const employer = await signup('employer')
  const job = await postJob(employer)
  const project = await postProject(employer)

  assert.equal((await deleteAccount(employer)).status, 204)

  assert.equal((await request(`/api/jobs/${job.id}`)).status, 404)
  assert.equal((await request(`/api/product-requests/${project.id}`)).status, 404)
  const board = await (await request('/api/jobs')).json()
  assert.equal(board.some((item) => item.id === job.id), false)
})
