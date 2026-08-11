import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Code2,
  ExternalLink,
  FileText,
  Filter,
  Globe2,
  GraduationCap,
  Layers3,
  Link2,
  MapPin,
  Play,
  Search,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { JobList, PageIntro, PreviewNotice, ProgressBar, SkillTags, StatusPill } from '../components/ProductUI.jsx'
import { certifications, courses, hackathons, jobs, projects } from '../data/mockData.js'
import { useToast } from '../components/ToastContext.jsx'

function ModuleStrip({ label, title, copy, status = 'Connection pending' }) {
  return (
    <div className="module-strip">
      <span className="module-strip__icon"><Code2 size={20} aria-hidden="true" /></span>
      <div><p>{label}</p><h2>{title}</h2><span>{copy}</span></div>
      <StatusPill tone="blue">{status}</StatusPill>
    </div>
  )
}

export function CoursesPage() {
  const [category, setCategory] = useState('All courses')
  const toast = useToast()
  const categories = ['All courses', 'Career skills', 'Workplace tools', 'Portfolio']
  const visibleCourses = courses.filter((course) => category === 'All courses' || course.category === category)

  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="Learning" title="Courses for the work ahead." copy="Short, practical learning paths designed around the skills students need before and during their first roles." tone="sage">
        <Link className="button button--dark" to="/discover/certifications">Browse certifications</Link>
      </PageIntro>
      <div className="page-container courses-layout">
        <section className="course-feature" aria-labelledby="course-feature-title">
          <span className="course-feature__shape" aria-hidden="true"><Play fill="currentColor" /></span>
          <div><p className="eyebrow">Featured pathway</p><h2 id="course-feature-title">Ready for your first week at work.</h2><p>A compact starter pathway covering communication, feedback, planning, and asking better questions.</p><button className="button button--white" type="button" onClick={() => toast('Course playback will connect here later.')}>Preview pathway <ArrowRight size={17} /></button></div>
        </section>
        <section className="course-library" aria-labelledby="course-library-title">
          <div className="content-heading"><div><p className="eyebrow">Course library</p><h2 id="course-library-title">Learn at your pace</h2></div></div>
          <div className="filter-chips" aria-label="Course categories">{categories.map((item) => <button key={item} type="button" className={category === item ? 'is-active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
          <div className="course-list">
            {visibleCourses.map((course, index) => (
              <article key={course.title}>
                <span className="course-number">0{index + 1}</span>
                <div className="course-list__copy"><p>{course.category}</p><h3>{course.title}</h3><span>{course.length} - {course.level}</span>{course.progress > 0 && <ProgressBar value={course.progress} label="Preview progress" />}</div>
                <button className="icon-button" type="button" aria-label={`Open ${course.title}`} onClick={() => toast('The course lesson view will connect here later.')}><ArrowUpRight size={18} /></button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export function JobCrawlerPage() {
  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="Discovery engine" title="Job crawler feed" copy="A frontend view for opportunities that the future crawler will collect, standardise, and send into Morrow." />
      <div className="page-container module-page">
        <ModuleStrip label="Project module" title="Job crawler" copy="Future service: collect student-focused jobs from public sources." />
        <PreviewNotice>The listings below are static mock data. No websites are being crawled.</PreviewNotice>
        <section className="feed-controls" aria-label="Crawler feed filters">
          <label className="form-field form-field--with-icon"><span>Search collected jobs</span><div><Search size={18} /><input type="search" placeholder="Role, source, or skill" /></div></label>
          <label className="form-field"><span>Source type</span><select defaultValue="All sources"><option>All sources</option><option>Company careers pages</option><option>Public listings</option><option>Employer submissions</option></select></label>
          <button className="button button--outline" type="button"><Filter size={17} /> More filters</button>
        </section>
        <section className="results-section" aria-labelledby="crawler-results-title">
          <div className="results-toolbar"><div><p className="eyebrow">Normalised feed preview</p><h2 id="crawler-results-title">Collected opportunities</h2></div><StatusPill tone="sage">8 mock records</StatusPill></div>
          <JobList items={jobs.slice(0, 6)} />
        </section>
      </div>
    </main>
  )
}

export function HackathonsPage() {
  const toast = useToast()
  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="Build and compete" title="Hackathons" copy="Discover challenges where students can test ideas, meet collaborators, and build something worth showing." tone="ink" />
      <div className="page-container module-page">
        <ModuleStrip label="Project module" title="Hackathon crawler" copy="Future service: collect public hackathon listings from companies and organisers." />
        <PreviewNotice>Events, organisers, and dates are fictional examples for the frontend shell.</PreviewNotice>
        <section className="event-list" aria-labelledby="hackathon-list-title">
          <div className="results-toolbar"><div><p className="eyebrow">Upcoming events</p><h2 id="hackathon-list-title">Find a challenge</h2></div><div className="filter-chips"><button className="is-active" type="button">All</button><button type="button">Virtual</button><button type="button">In person</button></div></div>
          {hackathons.map((event, index) => (
            <article key={event.name}>
              <div className="event-date"><span>AUG</span><strong>{22 + index * 7}</strong></div>
              <div className="event-main"><p>{event.theme}</p><h3>{event.name}</h3><span>By {event.organiser}</span><div><span><CalendarDays size={15} /> {event.date}</span><span><MapPin size={15} /> {event.location}</span><span><Globe2 size={15} /> {event.format}</span></div></div>
              <div className="event-side"><StatusPill tone={index === 0 ? 'coral' : 'sage'}>{event.deadline}</StatusPill><button className="text-action" type="button" onClick={() => toast('The event detail and registration flow will connect here later.')}>View event <ArrowUpRight size={16} /></button></div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export function CertificationsPage() {
  const toast = useToast()
  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="Credentials" title="Certifications worth exploring." copy="Compare beginner-friendly credentials and map them to the kinds of roles you want to pursue." tone="sage">
        <Link className="button button--dark" to="/courses">Explore Morrow courses</Link>
      </PageIntro>
      <div className="page-container module-page">
        <ModuleStrip label="Project module" title="Certification crawler" copy="Future service: collect public course and certificate details from learning providers." />
        <PreviewNotice>Provider names show the intended information structure only. No live catalogue connection is active.</PreviewNotice>
        <section className="certification-browser" aria-labelledby="certificate-list-title">
          <div className="certification-filters"><p className="eyebrow">Filter credentials</p><label><span>Level</span><select defaultValue="All levels"><option>All levels</option><option>Beginner</option><option>Foundation</option></select></label><label><span>Format</span><select defaultValue="All formats"><option>All formats</option><option>Online</option><option>Self-paced</option></select></label></div>
          <div className="certification-results">
            <div className="results-toolbar"><div><p className="eyebrow">Catalogue preview</p><h2 id="certificate-list-title">Popular starting points</h2></div></div>
            {certifications.map((certificate) => (
              <article key={certificate.title}>
                <span className="certificate-icon"><GraduationCap size={22} /></span>
                <div><p>{certificate.provider}</p><h3>{certificate.title}</h3><span>{certificate.level} - {certificate.duration} - {certificate.format}</span></div>
                <button className="icon-button" type="button" aria-label={`Preview ${certificate.title}`} onClick={() => toast('External course links will be connected after the crawler integration.')}><ExternalLink size={17} /></button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export function PortfolioBuilderPage() {
  const [name, setName] = useState('Your Name')
  const [headline, setHeadline] = useState('Student designer and thoughtful problem solver')
  const [sections, setSections] = useState({ projects: true, education: true, experience: false })
  const toast = useToast()

  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="CV and portfolio builder" title="Turn your work into a story." copy="Shape a clean public profile from your CV, practical projects, and Morrow activity." tone="ink"><StatusPill tone="sage">Builder preview</StatusPill></PageIntro>
      <div className="page-container module-page">
        <ModuleStrip label="Project module" title="CV portfolio builder" copy="Future service: combine CV details and completed work into a shareable page." />
        <PreviewNotice>The preview is local. Public links and saved profiles are not generated yet.</PreviewNotice>
        <div className="portfolio-builder">
          <form className="portfolio-controls" onSubmit={(event) => { event.preventDefault(); toast('Portfolio draft saved locally for this preview.') }}>
            <p className="eyebrow">Profile details</p>
            <h2>Shape your page</h2>
            <label className="form-field"><span>Display name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="form-field"><span>Headline</span><textarea rows="3" value={headline} onChange={(event) => setHeadline(event.target.value)} /></label>
            <fieldset><legend>Include sections</legend>{Object.entries(sections).map(([key, checked]) => <label className="check-row" key={key}><input type="checkbox" checked={checked} onChange={(event) => setSections((current) => ({ ...current, [key]: event.target.checked }))} /><span>{key[0].toUpperCase() + key.slice(1)}</span></label>)}</fieldset>
            <div className="portfolio-controls__link"><Link2 size={17} /><span>morrow.local/portfolio/your-name</span></div>
            <button className="button button--dark" type="submit">Save preview draft</button>
          </form>
          <section className="portfolio-preview" aria-label="Portfolio page preview">
            <div className="portfolio-preview__browser"><span /><span /><span /><small>Portfolio preview</small></div>
            <div className="portfolio-preview__body">
              <span className="portfolio-avatar" aria-hidden="true">{name === 'Your Name' ? 'YN' : name.split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</span>
              <p>Portfolio / 2026</p><h2>{name || 'Your Name'}</h2><h3>{headline || 'Add a short headline'}</h3>
              {sections.projects && <div className="portfolio-preview__section"><span>Selected project</span><strong>Student experience research</strong><p>A short case study preview will appear here.</p></div>}
              {sections.education && <div className="portfolio-preview__line"><span>Education</span><strong>Your programme and institution</strong></div>}
              {sections.experience && <div className="portfolio-preview__line"><span>Experience</span><strong>Your work and practical experience</strong></div>}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export function ProjectsPage() {
  const [department, setDepartment] = useState('All departments')
  const toast = useToast()
  const visibleProjects = useMemo(() => projects.filter((project) => department === 'All departments' || project.department === department), [department])

  return (
    <main id="main-content" className="product-page">
      <PageIntro eyebrow="Practical experience" title="Student project requests" copy="Take on small, useful briefs from university departments and external organisations, then carry completed work into your portfolio." tone="sage" />
      <div className="page-container module-page">
        <ModuleStrip label="Project module" title="Product requests" copy="Future service: post, join, track, and complete small scoped projects." />
        <PreviewNotice>Organisations and briefs are fictional examples. Joining and completion states are frontend placeholders.</PreviewNotice>
        <section className="project-browser" aria-labelledby="project-list-title">
          <aside className="project-filters"><p className="eyebrow">Find a brief</p><h2>Filter projects</h2><label><span>Department</span><select value={department} onChange={(event) => setDepartment(event.target.value)}><option>All departments</option><option>Information Systems</option><option>Marketing</option><option>Design</option><option>Computer Science</option></select></label><label><span>Status</span><select defaultValue="Open"><option>Open</option><option>In progress</option><option>Completed</option></select></label><div><Check size={18} /><p><strong>Completed work, connected.</strong><span>Future completed projects can feed directly into the portfolio builder.</span></p></div></aside>
          <div className="project-results"><div className="results-toolbar"><div><p className="eyebrow">Open requests</p><h2 id="project-list-title">{visibleProjects.length} project briefs</h2></div></div>{visibleProjects.map((project) => <article key={project.title}><div className="project-row__top"><span className="project-icon"><Layers3 size={20} /></span><StatusPill tone={project.status === 'Open' ? 'sage' : 'blue'}>{project.status}</StatusPill></div><p>{project.organisation}</p><h3>{project.title}</h3><div className="project-row__meta"><span><BriefcaseBusiness size={15} /> {project.department}</span><span><Clock3 size={15} /> {project.commitment}</span></div><SkillTags skills={project.skills} /><button className="text-action" type="button" onClick={() => toast('The project detail, team, and completion workflow will connect here later.')}>View project <ArrowUpRight size={16} /></button></article>)}</div>
        </section>
      </div>
    </main>
  )
}
