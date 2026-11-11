import './style.css'

type User = {
  _id?: string
  name?: string
  email?: string
  CompanyName?: string
}

type AppState = {
  token: string | null
  user: User | null
  role: 'APPLICANT' | 'ADMIN' | null
  jobs: any[]
  applications: any[]
  dashboard: any | null
}

const API_BASE = 'http://localhost:8000/api/v1'

const state: AppState = {
  token: localStorage.getItem('ats_token'),
  user: readUser(),
  role: (localStorage.getItem('ats_role') as 'APPLICANT' | 'ADMIN' | null) ?? null,
  jobs: [],
  applications: [],
  dashboard: null,
}

function readUser(): User | null {
  const data = localStorage.getItem('ats_user')
  if (!data) return null

  try {
    return JSON.parse(data) as User
  } catch {
    return null
  }
}

function saveSession(token: string, user: User, role: 'APPLICANT' | 'ADMIN') {
  state.token = token
  state.user = user
  state.role = role
  localStorage.setItem('ats_token', token)
  localStorage.setItem('ats_user', JSON.stringify(user))
  localStorage.setItem('ats_role', role)
}

function clearSession() {
  state.token = null
  state.user = null
  state.role = null
  state.jobs = []
  state.applications = []
  state.dashboard = null
  localStorage.removeItem('ats_token')
  localStorage.removeItem('ats_user')
  localStorage.removeItem('ats_role')
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {})

  if (state.token) {
    headers.set('Authorization', `Bearer ${state.token}`)
  }

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  let payload: any = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed')
  }

  return payload?.data ?? payload
}

async function loadJobs() {
  if (!state.token) return
  try {
    const jobs = await apiFetch('/jobs')
    state.jobs = jobs ?? []
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Could not load jobs')
  }
}

async function loadApplications() {
  if (!state.token) return
  try {
    const apps = await apiFetch('/applications')
    state.applications = apps ?? []
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Could not load applications')
  }
}

async function loadDashboard() {
  if (!state.token || state.role !== 'ADMIN') return
  try {
    const dashboard = await apiFetch('/auth/recruiter/dashboard')
    state.dashboard = dashboard ?? null
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Could not load dashboard')
  }
}

async function handleApplicantSignup(event: SubmitEvent) {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  const payload = {
    name: (form.elements.namedItem('name') as HTMLInputElement).value,
    email: (form.elements.namedItem('email') as HTMLInputElement).value,
    password: (form.elements.namedItem('password') as HTMLInputElement).value,
  }

  try {
    const result = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    saveSession(result.token, result.applicant, 'APPLICANT')
    form.reset()
    await loadJobs()
    await loadApplications()
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Signup failed')
  }
}

async function handleApplicantLogin(event: SubmitEvent) {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  const payload = {
    email: (form.elements.namedItem('email') as HTMLInputElement).value,
    password: (form.elements.namedItem('password') as HTMLInputElement).value,
  }

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    saveSession(result.token, result.applicant, 'APPLICANT')
    form.reset()
    await loadJobs()
    await loadApplications()
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Login failed')
  }
}

async function handleRecruiterLogin(event: SubmitEvent) {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  const payload = {
    email: (form.elements.namedItem('email') as HTMLInputElement).value,
    password: (form.elements.namedItem('password') as HTMLInputElement).value,
  }

  try {
    const result = await apiFetch('/auth/recruiter/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    saveSession(result.token, result.recruiter, 'ADMIN')
    form.reset()
    await loadJobs()
    await loadDashboard()
    await loadApplications()
    render()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Recruiter login failed')
  }
}

async function handleCreateJob(event: SubmitEvent) {
  event.preventDefault()
  const form = event.currentTarget as HTMLFormElement
  const rawStages = (form.elements.namedItem('jobStages') as HTMLInputElement).value
  const rawSkills = (form.elements.namedItem('skillReq') as HTMLInputElement).value

  const payload = {
    title: (form.elements.namedItem('title') as HTMLInputElement).value,
    description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
    numberOfPositions: Number((form.elements.namedItem('numberOfPositions') as HTMLInputElement).value),
    jobStages: rawStages
      .split(',')
      .map((stage) => stage.trim())
      .filter(Boolean)
      .map((name) => ({ name })),
    skillReq: rawSkills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  }

  try {
    await apiFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    form.reset()
    await loadJobs()
    await loadDashboard()
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Failed to create job')
  }
}

async function handleApply(jobId: string) {
  try {
    await apiFetch(`/applicants/apply/${jobId}`, { method: 'POST' })
    await loadApplications()
    await loadJobs()
    alert('Application submitted successfully')
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Could not apply')
  }
}

async function handleApplicationAction(action: 'advance' | 'reject' | 'hire' | 'withdraw', id: string) {
  try {
    await apiFetch(`/applications/${id}/${action}`, { method: 'PATCH' })
    await loadApplications()
    if (state.role === 'ADMIN') await loadDashboard()
    alert(`Action ${action} completed successfully`)
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Action failed')
  }
}

function renderJobs() {
  if (!state.jobs.length) {
    return '<p class="empty-state">No jobs available yet.</p>'
  }

  return state.jobs
    .map((job) => {
      const stages = Array.isArray(job.jobStages) ? job.jobStages.map((stage) => stage.name).join(', ') : 'No stages'
      const skills = Array.isArray(job.skillReq) ? job.skillReq.join(', ') : 'N/A'
      const hasApplied = state.applications.some((app) => app.appliedto?._id === job._id || app.appliedto === job._id)

      return `
        <article class="job-card">
          <div class="job-header">
            <div>
              <h3>${job.title}</h3>
              <small>${job.isOpen === false ? 'Closed' : 'Open'} • ${job.numberOfPositions} positions</small>
            </div>
            ${state.role === 'APPLICANT' ? `<button class="primary" data-action="apply" data-job-id="${job._id}" ${job.isOpen === false || hasApplied ? 'disabled' : ''}>${hasApplied ? 'Applied' : 'Apply'}</button>` : ''}
          </div>
          <p>${job.description}</p>
          <div class="meta"><strong>Stages:</strong> ${stages}</div>
          <div class="meta"><strong>Skills:</strong> ${skills}</div>
        </article>
      `
    })
    .join('')
}

function renderApplications() {
  if (!state.applications.length) {
    return '<p class="empty-state">No applications yet.</p>'
  }

  return state.applications
    .map((app) => {
      const jobName = app.appliedto?.title ?? 'Unknown job'
      const applicantName = app.appliedby?.name ?? 'Applicant'
      const status = app.terminalStatus ?? 'ACTIVE'
      const currentStage = app.appliedto?.jobStages?.[app.currentStageIndex]?.name ?? 'N/A'

      return `
        <article class="application-card">
          <div class="job-header">
            <div>
              <h3>${jobName}</h3>
              <small>${state.role === 'ADMIN' ? `${applicantName} • ` : ''}${status}</small>
            </div>
          </div>
          <p><strong>Current stage:</strong> ${currentStage}</p>
          <div class="action-row">
            ${state.role === 'APPLICANT' ? '<button class="secondary" data-application-action="withdraw" data-id="' + app._id + '">Withdraw</button>' : ''}
            ${state.role === 'ADMIN' ? '<button class="secondary" data-application-action="advance" data-id="' + app._id + '">Advance</button>' : ''}
            ${state.role === 'ADMIN' ? '<button class="secondary danger" data-application-action="reject" data-id="' + app._id + '">Reject</button>' : ''}
            ${state.role === 'ADMIN' ? '<button class="primary" data-application-action="hire" data-id="' + app._id + '">Hire</button>' : ''}
          </div>
        </article>
      `
    })
    .join('')
}

function renderDashboard() {
  if (!state.dashboard) return '<p class="empty-state">Recruiter dashboard is unavailable.</p>'

  const stats = state.dashboard.stats ?? {}
  const summary = Array.isArray(stats.statusSummary) ? stats.statusSummary : []

  return `
    <div class="stats-grid">
      <div class="stat-box"><span>Total Jobs</span><strong>${stats.totalJobs ?? 0}</strong></div>
      <div class="stat-box"><span>Open Jobs</span><strong>${stats.openJobs ?? 0}</strong></div>
      <div class="stat-box"><span>Total Applications</span><strong>${stats.totalApplications ?? 0}</strong></div>
      <div class="stat-box"><span>Total Applicants</span><strong>${stats.totalApplicants ?? 0}</strong></div>
    </div>
    <div class="status-summary">
      <h4>Status summary</h4>
      ${summary.length ? summary.map((entry) => `<div>${entry._id ?? 'N/A'}: ${entry.count}</div>`).join('') : '<p>No application statuses yet.</p>'}
    </div>
  `
}

function renderAuth() {
  if (!state.token || !state.user) {
    return `
      <div class="auth-grid">
        <div class="auth-card">
          <h3>Applicant signup</h3>
          <form id="applicant-signup-form">
            <input name="name" placeholder="Full name" required />
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button class="primary" type="submit">Sign up</button>
          </form>
        </div>

        <div class="auth-card">
          <h3>Applicant login</h3>
          <form id="applicant-login-form">
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button class="primary" type="submit">Login</button>
          </form>
        </div>

        <div class="auth-card">
          <h3>Recruiter login</h3>
          <form id="recruiter-login-form">
            <input name="email" type="email" placeholder="Recruiter email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button class="primary" type="submit">Recruiter login</button>
          </form>
        </div>
      </div>
    `
  }

  return `
    <div class="session-card">
      <div>
        <h3>Logged in as ${state.user.name || state.user.email || 'User'}</h3>
        <p>${state.role === 'ADMIN' ? 'Recruiter account' : 'Applicant account'}</p>
      </div>
      <button id="logout-button" class="secondary">Logout</button>
    </div>
  `
}

function renderApp() {
  const isLoggedIn = Boolean(state.token && state.user)

  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">ATS Demo</p>
          <h1>Job Application Tracking System</h1>
        </div>
        ${isLoggedIn ? `<button id="logout-button" class="secondary">Logout</button>` : ''}
      </header>

      <main class="layout">
        <section class="panel">
          <h2>Authentication</h2>
          ${renderAuth()}
        </section>

        ${state.role === 'ADMIN' ? `
          <section class="panel">
            <h2>Create job</h2>
            <form id="job-create-form" class="stack-form">
              <input name="title" placeholder="Job title" required />
              <textarea name="description" placeholder="Job description" rows="4" required></textarea>
              <input name="numberOfPositions" type="number" min="1" placeholder="Number of positions" required />
              <input name="jobStages" placeholder="Stages separated by commas, e.g. Resume Review, Tech Round, HR" required />
              <input name="skillReq" placeholder="Skills separated by commas" />
              <button class="primary" type="submit">Create job</button>
            </form>
          </section>
        ` : ''}

        <section class="panel">
          <h2>Jobs</h2>
          <div id="jobs-container">${renderJobs()}</div>
        </section>

        <section class="panel">
          <h2>${state.role === 'ADMIN' ? 'Dashboard' : 'My applications'}</h2>
          ${state.role === 'ADMIN' ? renderDashboard() : `<div id="applications-container">${renderApplications()}</div>`}
        </section>
      </main>
    </div>
  `

  bindHandlers()
}

function bindHandlers() {
  const applicantSignupForm = document.querySelector<HTMLFormElement>('#applicant-signup-form')
  const applicantLoginForm = document.querySelector<HTMLFormElement>('#applicant-login-form')
  const recruiterLoginForm = document.querySelector<HTMLFormElement>('#recruiter-login-form')
  const logoutButton = document.querySelector<HTMLButtonElement>('#logout-button')
  const jobCreateForm = document.querySelector<HTMLFormElement>('#job-create-form')

  applicantSignupForm?.addEventListener('submit', handleApplicantSignup)
  applicantLoginForm?.addEventListener('submit', handleApplicantLogin)
  recruiterLoginForm?.addEventListener('submit', handleRecruiterLogin)
  jobCreateForm?.addEventListener('submit', handleCreateJob)
  logoutButton?.addEventListener('click', async () => {
    try {
      if (state.token) {
        const role = state.role
        await apiFetch(role === 'ADMIN' ? '/auth/recruiter/logout' : '/auth/logout', { method: 'POST' })
      }
    } catch {
      // ignore logout errors and clear local session anyway
    } finally {
      clearSession()
      renderApp()
    }
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="apply"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.jobId
      if (id) handleApply(id)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-application-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.applicationAction as 'advance' | 'reject' | 'hire' | 'withdraw'
      const id = button.dataset.id
      if (action && id) handleApplicationAction(action, id)
    })
  })
}

renderApp()

if (state.token && state.role === 'ADMIN') {
  void loadDashboard()
}

if (state.token) {
  void loadJobs()
  void loadApplications()
}
