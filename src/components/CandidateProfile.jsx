import { useEffect, useId, useState } from 'react'
import { Download, ExternalLink, UserRound } from 'lucide-react'
import { PortfolioView } from '../pages/PortfolioPages.jsx'

const PROFILE_LABELS = {
  studyLevel: 'Study level',
  institution: 'Institution',
  fieldOfStudy: 'Field of study',
  graduationYear: 'Graduation year',
  roles: 'Roles of interest',
  workSetup: 'Preferred work setup',
}

// A candidate's published portfolio. Unpublished portfolios stay private, so
// without a slug only a short note is shown.
export function CandidatePortfolio({ name, portfolioSlug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(Boolean(portfolioSlug))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!portfolioSlug) return undefined
    let active = true
    fetch(`/api/portfolios/${encodeURIComponent(portfolioSlug)}`)
      .then((response) => {
        if (!response.ok) throw new Error('not available')
        return response.json()
      })
      .then((body) => { if (active) setData(body) })
      .catch(() => { if (active) setError('This portfolio could not be loaded. Please try again later.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [portfolioSlug])

  if (!portfolioSlug) {
    return (
      <div className="candidate-portfolio candidate-portfolio--empty">
        <p>{name} has not published a portfolio yet.</p>
      </div>
    )
  }

  return (
    <div className="candidate-portfolio">
      {loading && <p>Loading portfolio...</p>}
      {!loading && error && (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && data && (
        <>
          <a className="text-action" href={`/portfolio/${portfolioSlug}`} target="_blank" rel="noopener noreferrer">
            Open full portfolio <ExternalLink size={16} aria-hidden="true" />
          </a>
          <section className="portfolio-preview" aria-label={`${data.displayName}'s portfolio`}>
            <PortfolioView portfolio={data} education={data.education} morrowWork={data.morrowWork} />
          </section>
        </>
      )}
    </div>
  )
}

// One applicant to a job or project. Clicking their name (or Profile) shows the
// resume answers and portfolio they shared by applying.
export function ApplicantCard({ applicant, resumeHref, children }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const profileItems = Object.entries(PROFILE_LABELS).filter(([key]) => applicant.profile?.[key])

  return (
    <div className="applicant-card">
      <div className="applicant-row">
        <div className="applicant-avatar">{applicant.name.charAt(0).toUpperCase()}</div>
        <div className="applicant-info">
          <strong>
            <button className="candidate-name-button" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
              {applicant.name}
            </button>
          </strong>
          <span>
            <a href={`mailto:${applicant.email}`}>{applicant.email}</a>
            {` · applied ${new Date(applicant.appliedAt).toLocaleDateString()}`}
          </span>
        </div>
        <div className="applicant-actions">
          {children}
          <button className="text-action" type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
            <UserRound size={16} aria-hidden="true" /> {open ? 'Hide profile' : 'Profile'}
          </button>
          {applicant.hasResumeFile && resumeHref && (
            <a className="text-action" href={resumeHref}>
              Resume <Download size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
      {open && (
        <div className="applicant-profile" id={panelId}>
          {profileItems.length > 0 ? (
            <dl className="account-details">
              {profileItems.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{applicant.profile[key]}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="account-muted">{applicant.name} has not answered the profile questions yet.</p>
          )}
          <CandidatePortfolio name={applicant.name} portfolioSlug={applicant.portfolioSlug} />
        </div>
      )}
    </div>
  )
}
