import { useEffect, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, FileText, Trash2, UserRound, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageIntro, StatusPill } from '../components/ProductUI.jsx'
import { useToast } from '../components/ToastContext.jsx'
import { useAuth } from '../components/AuthContext.jsx'

const PROFILE_LABELS = {
  studyLevel: 'Current study level',
  institution: 'Institution',
  fieldOfStudy: 'Field of study',
  graduationYear: 'Graduation year',
  roles: 'Roles of interest',
  workSetup: 'Preferred work setup',
}

const STATUS_TONES = {
  draft: 'blue',
  published: 'sage',
  closed: 'coral',
  Open: 'sage',
  'In Progress': 'blue',
  Completed: 'coral',
}

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '')

function SectionHeading({ icon: Icon, eyebrow, title, id }) {
  return (
    <div className="form-section-heading">
      <span className="step-icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <p>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </div>
  )
}

function DetailList({ items }) {
  return (
    <dl className="account-details">
      {items.filter(([, value]) => value).map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function CandidateSections({ overview }) {
  const { resume, portfolio, applications } = overview
  const profileItems = Object.entries(PROFILE_LABELS).map(([key, label]) => [label, resume?.profile?.[key]])

  return (
    <>
      <section aria-labelledby="account-resume-title">
        <SectionHeading icon={FileText} eyebrow="Candidate profile" title="Resume and portfolio" id="account-resume-title" />
        <DetailList
          items={[
            ['Resume file', resume?.file ? `${resume.file.fileName} (uploaded ${formatDate(resume.file.uploadedAt)})` : 'None uploaded'],
            ['Visible to employers', resume?.visibleToEmployers ? 'Yes' : 'No'],
            ...profileItems,
            ['Portfolio', portfolio ? `/portfolio/${portfolio.slug} (${portfolio.published ? 'public' : 'private'})` : 'Not created yet'],
          ]}
        />
        <div className="employer-job__actions">
          <Link className="text-action" to="/candidates/resume">
            Edit resume <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link className="text-action" to="/portfolio-builder">
            Edit portfolio <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="account-applications-title">
        <SectionHeading icon={BriefcaseBusiness} eyebrow="Your activity" title="Applications" id="account-applications-title" />
        {applications.length === 0 && <p className="account-muted">You have not applied to any jobs or projects yet.</p>}
        {applications.map((application) => (
          <article className="employer-job" key={`${application.kind}-${application.id}`}>
            <div className="employer-job__summary">
              <div>
                <h3>
                  <Link to={application.kind === 'job' ? `/jobs/posted/${application.id}` : `/projects/${application.id}`}>
                    {application.title || 'Untitled'}
                  </Link>
                </h3>
                <p>
                  {[application.kind === 'job' ? 'Job' : 'Project', application.company, application.appliedAt && `applied ${formatDate(application.appliedAt)}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <StatusPill tone="blue">{application.status}</StatusPill>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

function OrganizationPostings({ organization }) {
  const { apiFetch } = useAuth()
  const toast = useToast()
  const [jobs, setJobs] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canDelete = organization.role === 'owner' || organization.role === 'recruiter'
  const jobsPath = `/api/organizations/${organization.id}/jobs`

  useEffect(() => {
    let active = true
    Promise.all([apiFetch(jobsPath), apiFetch(`/api/organizations/${organization.id}/product-requests`)])
      .then(([jobData, projectData]) => {
        if (!active) return
        setJobs(jobData)
        setProjects(projectData)
      })
      .catch(() => { if (active) setError('Could not load your postings. Please try again later.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [apiFetch, jobsPath, organization.id])

  const remove = async (kind, item) => {
    if (!window.confirm(`Delete "${item.title || 'Untitled'}"? This cannot be undone.`)) return
    setBusy(true)
    try {
      await apiFetch(kind === 'job' ? `${jobsPath}/${item.id}` : `/api/product-requests/${item.id}`, { method: 'DELETE' })
      const setList = kind === 'job' ? setJobs : setProjects
      setList((current) => current.filter((entry) => entry.id !== item.id))
      toast('Deleted.')
    } catch (deleteError) {
      toast(deleteError.message)
    } finally {
      setBusy(false)
    }
  }

  const postings = [
    ...jobs.map((job) => ({ kind: 'job', item: job, label: 'Job', status: job.status, detail: [job.type, job.location] })),
    ...projects.map((project) => ({ kind: 'project', item: project, label: 'Project', status: project.status, detail: [project.category, project.pay || 'Unpaid'] })),
  ]

  return (
    <section aria-labelledby={`account-org-${organization.id}`}>
      <SectionHeading icon={BriefcaseBusiness} eyebrow={`Your company · ${organization.role}`} title={organization.name} id={`account-org-${organization.id}`} />
      {loading && <p>Loading your postings...</p>}
      {!loading && error && (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && postings.length === 0 && <p className="account-muted">No jobs or projects posted yet.</p>}
      {!loading && !error && postings.map(({ kind, item, label, status, detail }) => (
        <article className="employer-job" key={`${kind}-${item.id}`}>
          <div className="employer-job__summary">
            <div>
              <h3>{item.title || `Untitled ${label.toLowerCase()}`}</h3>
              <p>
                {[label, ...detail, `${item.applicantCount} applicant${item.applicantCount === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <StatusPill tone={STATUS_TONES[status]}>{status}</StatusPill>
          </div>
          <div className="employer-job__actions">
            <Link
              className="text-action"
              to={kind === 'job' ? `/employers/post-job?applicants=${item.id}` : `/projects/${item.id}`}
            >
              <Users size={16} aria-hidden="true" /> View applicants
            </Link>
            {canDelete && (
              <button className="text-action" type="button" onClick={() => remove(kind, item)} disabled={busy}>
                <Trash2 size={16} aria-hidden="true" /> Delete
              </button>
            )}
          </div>
        </article>
      ))}
      <div className="employer-job__actions">
        <Link className="text-action" to="/employers/post-job">
          Post or edit jobs and projects <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

function DeleteAccountSection({ overview }) {
  const { deleteAccount } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const isCandidate = overview.account.accountType === 'candidate'
  const deletedOrganizations = overview.organizations.filter((organization) => organization.deletedWithAccount)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await deleteAccount(password, () => navigate('/', { replace: true }))
      toast('Your account and personal information have been deleted.')
    } catch (deleteError) {
      setError(deleteError.status === 401 ? 'That password is not correct.' : deleteError.message)
      setBusy(false)
    }
  }

  return (
    <form className="account-danger" onSubmit={submit} aria-labelledby="account-delete-title">
      <SectionHeading icon={Trash2} eyebrow="Danger zone" title="Delete account" id="account-delete-title" />
      <p>This permanently deletes your account and the personal information Morrow stores about you. It cannot be undone.</p>
      <ul>
        <li>Your name, email address, password and login sessions</li>
        {isCandidate && <li>Your resume file, profile answers and portfolio (its public link will stop working)</li>}
        {isCandidate && <li>Your applications to jobs and projects</li>}
        {deletedOrganizations.map((organization) => (
          <li key={organization.id}>
            The company <strong>{organization.name}</strong> and all of its jobs and projects, because you are its only owner
          </li>
        ))}
      </ul>
      <label className="form-field">
        <span>Enter your password to confirm</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <label className="account-confirm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>I understand this cannot be undone</span>
      </label>
      {error && <p className="account-error" role="alert">{error}</p>}
      <div>
        <button className="button button--danger" type="submit" disabled={!confirmed || !password || busy}>
          <Trash2 size={16} aria-hidden="true" /> {busy ? 'Deleting...' : 'Delete my account'}
        </button>
      </div>
    </form>
  )
}

export function AccountPage() {
  const { apiFetch } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiFetch('/api/account')
      .then((data) => { if (active) setOverview(data) })
      .catch(() => { if (active) setError('Could not load your profile. Please try again later.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [apiFetch])

  const account = overview?.account

  return (
    <main id="main-content" className="product-page">
      <PageIntro
        eyebrow="Your account"
        title="My profile"
        copy="See the personal information Morrow stores about you, and delete it when you no longer need it."
      />
      <div className="page-container account-page">
        {loading && <p>Loading your profile...</p>}
        {!loading && error && (
          <div className="empty-state">
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && overview && (
          <>
            <div className="form-surface">
              <section aria-labelledby="account-personal-title">
                <SectionHeading icon={UserRound} eyebrow="Personal information" title="Account details" id="account-personal-title" />
                <DetailList
                  items={[
                    ['Name', account.displayName],
                    ['Email', account.email],
                    ['Account type', account.accountType === 'candidate' ? 'Candidate' : 'Employer'],
                    ['Member since', formatDate(account.createdAt)],
                  ]}
                />
              </section>
              {account.accountType === 'candidate' && <CandidateSections overview={overview} />}
              {overview.organizations.map((organization) => (
                <OrganizationPostings key={organization.id} organization={organization} />
              ))}
            </div>
            <DeleteAccountSection overview={overview} />
          </>
        )}
      </div>
    </main>
  )
}
