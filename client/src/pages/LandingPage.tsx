import { useEffect, useRef, useState, type FormEvent } from 'react'
import '../styles/landing.css'

const CONTACT_EMAIL = 'CatholicInnovation@OptionC.com'

const REVEAL_SELECTOR =
  '.sec-head, .ledger, .ladder, .costs, .life, .swaps, .offer, .hours, .perm-scroll'

let pageViewSent = false
let formStartSent = false

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState({ text: '', cls: '' })
  const [btnLabel, setBtnLabel] = useState('Request a Discovery Session')
  const [btnDisabled, setBtnDisabled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) {
      document.body.classList.remove('nav-lock')
      document.body.style.removeProperty('--nav-lock-gap')
      return
    }

    // Compensating for the scrollbar width prevents the viewport from growing
    // when overflow is locked — that growth was flipping past 1024px and hiding the hamburger.
    const gap = Math.max(0, window.innerWidth - document.documentElement.clientWidth)
    document.body.style.setProperty('--nav-lock-gap', `${gap}px`)
    document.body.classList.add('nav-lock')

    return () => {
      document.body.classList.remove('nav-lock')
      document.body.style.removeProperty('--nav-lock-gap')
    }
  }, [navOpen])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const onChange = () => {
      if (!mq.matches) setNavOpen(false)
    }
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  function closeNav() {
    setNavOpen(false)
  }

  useEffect(() => {
    if (pageViewSent) return
    pageViewSent = true
    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventType: 'page_view', path: '/' }),
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    const els = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))

    if (m.matches || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'))
      return
    }

    els.forEach((el) => el.classList.add('reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            ;(en.target as HTMLElement).classList.add('in')
            io.unobserve(en.target)
          }
        })
      },
      { rootMargin: '0px 0px -60px 0px', threshold: 0.05 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  function onFormFocus() {
    if (formStartSent) return
    formStartSent = true
    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ eventType: 'form_start', path: '/#talk' }),
    }).catch(() => {})
  }

  async function onSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    const form = ev.currentTarget
    const fd = new FormData(form)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const organization = String(fd.get('organization') || '').trim()
    const role = String(fd.get('role') || '')
    const message = String(fd.get('message') || '').trim()

    if (!name || !email || !organization || !role) {
      setNote({ text: 'Please complete name, email, organization, and role.', cls: 'err' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNote({ text: 'That email address does not look right.', cls: 'err' })
      return
    }

    setBtnDisabled(true)
    setBtnLabel('Sending…')
    try {
      const r = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, organization, role, message }),
      })
      if (!r.ok) throw new Error(String(r.status))
      form.reset()
      setBtnLabel('Request received')
      setNote({ text: 'Thank you. We will be in touch to arrange a session.', cls: 'ok' })
    } catch {
      setBtnDisabled(false)
      setBtnLabel('Request a Discovery Session')
      setNote({
        text:
          'That did not send. Please email ' +
          CONTACT_EMAIL +
          ' and we will pick it up from there.',
        cls: 'err',
      })
    }
  }

  return (
    <div ref={rootRef} className="landing-root">
      <nav className={`nav${navOpen ? ' is-open' : ''}`}>
        <div className="nav-in">
          <div className="mark">The Catholic Family <b>Record</b></div>
          <div className="nav-actions">
            <a className="nav-cta nav-cta-desktop" href="#talk">Discuss a partnership</a>
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={navOpen}
              aria-controls="landing-nav-menu"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
          <div id="landing-nav-menu" className="nav-links">
            <a href="#problem" onClick={closeNav}>The problem</a>
            <a href="#today" onClick={closeNav}>What exists</a>
            <a href="#parish" onClick={closeNav}>Parish &amp; school</a>
            <a href="#diocese" onClick={closeNav}>Diocese</a>
            <a href="#replace" onClick={closeNav}>Replacing your stack</a>
            <a href="#founding" onClick={closeNav}>Founding program</a>
            <a className="nav-cta nav-cta-mobile" href="#talk" onClick={closeNav}>Discuss a partnership</a>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <header className="hero">
        <div className="wrap hero-in">
          <div className="eyebrow-l">OptionC · Serving Catholic schools and parishes for over 20 years</div>
          <h1>Your diocese knows every family. <span>In pieces.</span></h1>
          <p className="lede-l">The school holds one record. The parish holds another. Giving holds a third, the emergency list a fourth, the diocesan mailing list a fifth. Nobody is doing anything wrong — and no one can see the family whole. The Catholic Family Record makes them one, and gives your staff back the hours that fragmentation quietly costs.</p>

          <div className="fork">
            <a href="#parish">
              <span className="fk-l">Start here</span>
              <span className="fk-t">I lead a parish or a school</span>
              <span className="fk-s">The office work this ends, starting Monday</span>
            </a>
            <a href="#diocese">
              <span className="fk-l">Start here</span>
              <span className="fk-t">I lead a diocese</span>
              <span className="fk-s">What fragmentation costs every chancery office</span>
            </a>
          </div>

          <div className="hero-foot">One family · One record · One faith</div>
        </div>
      </header>

      {/* ============ THE PROBLEM ============ */}
      <section className="sec" id="problem">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">The problem, as it actually happens</div>
            <h2>The same family, entered six times, by six people who will never meet.</h2>
            <p className="lede">A family joins your parish and enrolls a child in your school. Here is what that costs your staff this week — before anyone has taught a class, prepared a homily, or visited a home.</p>
          </div>

          <div className="ledger" id="ledger">
            <div className="ledger-hd"><span>Register of entry — one household</span><span>Tuesday</span></div>
            <div className="ledger-row"><span className="lr-sys">School SIS</span><span className="lr-name">Kowalski, Anna &amp; Michael</span><span className="lr-time">9:40 a.m.</span></div>
            <div className="ledger-row"><span className="lr-sys">Parish census</span><span className="lr-name">Kowalski, Michael &amp; Anna</span><span className="lr-time">11:15 a.m.</span></div>
            <div className="ledger-row"><span className="lr-sys">Diocesan newspaper</span><span className="lr-name">Kowalski, M.</span><span className="lr-time">1:20 p.m.</span></div>
            <div className="ledger-row"><span className="lr-sys">Giving platform</span><span className="lr-name">Kowalsky, Michael</span><span className="lr-time">2:05 p.m.</span></div>
            <div className="ledger-row"><span className="lr-sys">Emergency list</span><span className="lr-name">Kowalski family</span><span className="lr-time">3:30 p.m.</span></div>
            <div className="ledger-row"><span className="lr-sys">Volunteer roster</span><span className="lr-name">A. Kowalski</span><span className="lr-time">4:45 p.m.</span></div>
            <div className="ledger-foot">Six entries. One misspelling that will never be caught. When Anna's mobile number changes in March, five of these six will still be wrong in June — including the one the school would use in an emergency.</div>
          </div>

          <div className="ledger ledger-one" style={{marginTop: '20px'}}>
            <div className="ledger-hd"><span>With the Catholic Family Record</span><span>Tuesday</span></div>
            <div className="ledger-row"><span className="lr-sys">Entered once</span><span className="lr-name">Kowalski, Anna &amp; Michael</span><span className="lr-time">9:40 a.m.</span></div>
            <div className="ledger-foot">Enrollment, parish registration, tuition, giving, alerts, and volunteering all read the same record. Anna changes her number once, in March, and every office has it that afternoon.</div>
          </div>
        </div>
      </section>

      {/* ============ ADMIN → MISSION ============ */}
      <section className="sec sec-paper">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Why this is a mission problem</div>
            <h2>The hours are not the point. What the hours were <em className="g">supposed to be</em> is the point.</h2>
            <p className="lede">Nobody entered ministry to re-key a phone number. Duplicate data entry is not an inconvenience your staff absorbs — it is catechesis, OCIA follow-up, home visits, and sacramental preparation that quietly does not happen, in every parish, every week, forever.</p>
          </div>

          <div className="hours narrow">
            <div className="eyebrow" style={{marginBottom: '16px'}}>Illustrative &middot; a diocese of ninety parishes</div>
            <div className="hours-row"><span>Hours a parish office recovers each week</span><span className="hv">6</span></div>
            <div className="hours-row"><span>Weeks in the working year</span><span className="hv">48</span></div>
            <div className="hours-row"><span>Parishes in the diocese</span><span className="hv">90</span></div>
            <div className="hours-row"><span>Hours returned to ministry, per year</span><span className="hv">25,920</span></div>
            <div className="hours-out">That is roughly <strong>thirteen full-time people</strong> given back to the diocese — not hired, not budgeted for, just recovered from work the software should never have created.</div>
          </div>

        </div>
      </section>

      {/* ============ PARISH & SCHOOL PATH ============ */}
      <section className="sec" id="parish">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">For pastors, principals, and business managers</div>
            <h2>What one shared record ends.</h2>
            <p className="lede">Not features. Failures — the specific, recurring ones your office has stopped noticing because they have always been true.</p>
          </div>

          <dl className="costs">
            <div className="cost"><dt>Driving for a certificate</dt><dd>A Confirmation candidate needs a baptismal record from a parish two towns over. Someone calls, waits, then gets in a car. With one record, the certificate is already attached to the family, verified by the issuing parish.</dd></div>
            <div className="cost"><dt>The notice nobody read</dt><dd>A family with three children receives the same closure announcement four times, from four lists — and still misses the one that mattered, because the list with the current number was the one nobody updated.</dd></div>
            <div className="cost"><dt>Begging for catechists</dt><dd>The parish pleads for volunteers in the bulletin while the school already knows exactly which parents show up. Two rosters, one community, no connection between them.</dd></div>
            <div className="cost"><dt>Strangers in March</dt><dd>A family enrolls in September and registers at the parish in March — as new people, filling out the same form again. The school was the parish's front door and nobody was standing in it.</dd></div>
            <div className="cost"><dt>The family nobody invited<span className="co-note">The one that matters most</span></dt><dd>A non-Catholic family spends four years on your campus, at every Christmas concert and every fundraiser, and is never personally invited into the life of the parish — because the person who runs OCIA has no idea they exist.</dd></div>
          </dl>
        </div>
      </section>

      {/* ============ MULTI-PARISH PRIVACY ============ */}
      <section className="sec sec-paper">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">The question every pastor asks first</div>
            <h2>Shared where it should be. Separate where it must be.</h2>
            <p className="lede">One school, supported by three parishes, where the pastors are not about to share giving data with one another. That is not an edge case — it is the direction Catholic education is moving. The record belongs to the family, not the institution, and every office sees only what it has a reason to see.</p>
          </div>

          <div className="perm-scroll">
            <table className="perm">
              <thead><tr><th style={{textAlign: 'left'}}>Information</th><th>The family</th><th>This parish</th><th>Partner parish</th><th>The school</th><th>Diocese</th></tr></thead>
              <tbody>
                <tr><th>Family identity &amp; contact</th><td className="yes">Manages it</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td><td className="yes">Yes</td></tr>
                <tr><th>Sacramental record</th><td className="yes">Yes</td><td className="yes">Yes</td><td className="cond">On request</td><td className="yes">Yes</td><td className="yes">Yes</td></tr>
                <tr><th>Enrollment &amp; academics</th><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="yes">Yes</td><td className="cond">Totals only</td></tr>
                <tr><th>Giving history</th><td className="yes">Yes</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="cond">Totals only</td></tr>
                <tr><th>Tuition assistance</th><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="yes">Yes</td><td className="no">No</td></tr>
                <tr><th>Pastoral notes</th><td className="no">No</td><td className="yes">Yes</td><td className="no">No</td><td className="no">No</td><td className="no">No</td></tr>
              </tbody>
            </table>
          </div>

          <p className="narrow" style={{marginTop: '24px', fontSize: '15px', color: 'var(--muted)', textAlign: 'center'}}>Scope is enforced in the data layer, not hidden in the interface, and every access is logged. A pastor can see precisely who opened his families' records and when.</p>

          <div className="seamless narrow">
            <div className="sl-e">The case that runs the other way</div>
            <h3>Safe environment is where boxing information becomes the danger.</h3>
            <p>A volunteer's clearance is a fact about a person, not a record belonging to one office. She completes her training, her background check, her fingerprinting — once. The parish that cleared her, the school where she coaches on Saturdays, and the diocese that must account for her all see the same status and the same expiry date, because it is the same fact.</p>
            <p>She is not processed twice for the same year. She does not start over when her family moves to a parish across the diocese. And nobody discovers in October that her certification lapsed in April, because the record that holds her clearance is the record every office is already looking at.</p>
            <p>This is the same permission model doing the opposite job. Giving history stops at the parish boundary because it should. Compliance crosses every boundary because it must. A system that cannot tell those two apart will get one of them wrong.</p>
          </div>

          <div className="seamless narrow" style={{marginTop: '26px'}}>
            <div className="sl-e">The column that is usually missing</div>
            <h3>The one person who cannot reach the record is the person it belongs to.</h3>
            <p>Most parish systems treat a parishioner as the subject of a record rather than a participant in it. A new phone number, a change of address, a child gone off to college, a willingness to serve on a Saturday &mdash; all of it has to travel through a staff member who is already underwater. The office becomes the bottleneck for information it does not own and never asked to hold.</p>
            <p>Every January the same three weeks arrive: hundreds of contribution statement requests, each handled by hand, every one of them urgent because people are filing. Not one of them needed a person.</p>
            <p>And a thirty&#8209;four&#8209;year&#8209;old who manages her mortgage, her pediatrician, and her child&rsquo;s lunch account from her phone will not call a parish office between nine and three. She is not disengaged. She has been handed the one institution in her life that still requires a phone call, and she drifts without ever deciding to. Friction is never neutral &mdash; when volunteering means noticing a bulletin notice and calling during business hours, the parish has built a filter that screens out working parents, who are precisely the families most likely to give and most likely to stay.</p>
            <p>The Church teaches stewardship as participation. A system in which a parishioner can only ever receive &mdash; never update, never volunteer, never see their own giving &mdash; quietly makes participation something done to them. This record is built the other way around. The family holds its own, keeps it current, prints its own statements, and steps forward to serve without needing to ask anyone first.</p>
          </div>
        </div>
      </section>

      {/* ============ THE LADDER ============ */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">How this grows</div>
            <h2>Start where you are. Grow into the whole diocese.</h2>
            <p className="lede">No diocese replaces six systems in a summer, and we will not ask you to. Begin with the pain everyone already feels. The rest is already built when you are ready for it.</p>
          </div>

          <div className="ladder">
            <div className="rung">
              <div className="rg-n">Stage one</div>
              <h3>Parish and school</h3>
              <p>One record shared between the two offices that already serve the same families.</p>
              <ul>
                <li>Enrollment and parish registration on one household</li>
                <li>Sacramental history connected to the classroom</li>
                <li>One communication list, one emergency list</li>
                <li>Tuition and offertory in a single family view</li>
              </ul>
            </div>
            <div className="rung">
              <div className="rg-n">Stage two</div>
              <h3>The ministries join</h3>
              <p>Every ministry currently keeping its own list stops keeping its own list.</p>
              <ul>
                <li>Volunteers and ministry scheduling</li>
                <li>Altar servers and server formation</li>
                <li>Faith formation, OCIA, and sacramental prep</li>
                <li>Music ministry and parish societies</li>
                <li>Safe environment training and clearances</li>
              </ul>
            </div>
            <div className="rung">
              <div className="rg-n">Stage three</div>
              <h3>The diocese connects</h3>
              <p>Every parish and school rolls up, and families stop disappearing when they move.</p>
              <ul>
                <li>Mission reporting across all institutions</li>
                <li>A family who moves stays known</li>
                <li>Sacramental records survive a merger or closure</li>
                <li>One reach for diocesan communication and alerts</li>
              </ul>
            </div>
          </div>

          <div className="statnote">
            <div className="sn-fig">Nationally, volunteers donate to charity at roughly twice the rate of non&#8209;volunteers — about 80 percent, against 40 percent of non&#8209;volunteers.</div>
            <p>Service and generosity tend to travel together. Yet in most parishes the ministry roster and the offertory record sit in systems that have never been introduced, so a parish cannot easily thank, form, or invite the people already giving it their Saturdays. Stage two is where that stops.</p>
            <p className="sn-src">Source · Volunteering and Civic Life in America, AmeriCorps with the U.S. Census Bureau.<br />Association, not causation — generous people tend to do both. The record makes the overlap visible; it does not manufacture generosity.</p>
          </div>
        </div>
      </section>

      {/* ============ DIOCESAN PATH ============ */}
      <section className="sec sec-paper" id="diocese">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">For the bishop's office</div>
            <h2>Fragmentation does not stop at the parish. It reaches every office in the chancery.</h2>
            <p className="lede">Each of these is a director who has already built a workaround — a spreadsheet, a phone call, a folder. The workarounds are the tell. Every one of them exists because no system holds the family whole.</p>
          </div>

          <dl className="costs">
            <div className="cost"><dt>Safe environment<span className="co-note">Liability, not convenience</span></dt><dd>Volunteer clearances and training tracked parish by parish, in spreadsheets, with no diocesan view of who is currently compliant and who lapsed in April. This is the office where fragmentation stops being an inefficiency and becomes an exposure.</dd></div>
            <div className="cost"><dt>Tribunal &amp; marriage prep</dt><dd>Cases wait on baptismal and confirmation records held by a parish that may since have merged, closed, or boxed its registers. Weeks of delay, entirely clerical.</dd></div>
            <div className="cost"><dt>Vocations</dt><dd>No way to follow a young person from Catholic school through youth ministry into young adulthood. The office charged with finding the next generation of priests cannot see them.</dd></div>
            <div className="cost"><dt>Development &amp; annual appeal</dt><dd>The same household solicited three times under three spellings, at two addresses. No way to distinguish a lapsed donor from a family that simply moved across town.</dd></div>
            <div className="cost"><dt>Superintendent of schools<span className="co-note">Support, not oversight</span></dt><dd>In a parish school the pastor governs and the superintendent advises — and an advisor working without shared data can only offer generalities. Today a superintendent usually learns a school is in enrollment trouble when the pastor tells him, a year after it could have been acted on. One record lets him bring a pastor early warning, comparable benchmarks, and the experience of every other school facing the same thing. What the pastor does with it remains the pastor's decision.</dd></div>
            <div className="cost"><dt>Evangelization &amp; OCIA</dt><dd>Programs designed in the dark, blind to the non-Catholic families already on Catholic campuses every single day — the warmest prospects in the diocese, invisible to the office whose job they are.</dd></div>
            <div className="cost"><dt>Catholic Charities</dt><dd>Serving families the parish never knew were in need, while the parish serves families Charities never knew it was already helping.</dd></div>
            <div className="cost"><dt>Communications &amp; emergency</dt><dd>No way to reach the diocese without rebuilding the list, and no confidence the list is current when it matters most.</dd></div>
          </dl>
        </div>
      </section>

      {/* ============ THE FAMILY WHO MOVES ============ */}
      <section className="sec sec-teal">
        <div className="wrap narrow" style={{textAlign: 'center'}}>
          <div className="eyebrow-l">The record that follows</div>
          <h2 style={{margin: '14px 0 20px'}}>A family moves across town and vanishes.</h2>
          <p className="lede-l">They were registered at St. Mary's for eleven years. Three children baptized, two confirmed, a decade of offertory. They move four miles, to a parish in the same diocese, under the same bishop — and arrive as strangers. Nobody at Holy Cross knows they are coming. Nobody at St. Mary's knows they arrived. If they never quite get around to registering, the diocese records it as attrition, and no one can tell the difference between a family that left the Church and a family that changed address.</p>
          <p className="lede-l" style={{marginTop: '20px', color: 'var(--gold-bright)'}}>One record in the diocese means the family is known before they walk in — and the difference between moving and leaving is finally visible.</p>
        </div>
      </section>

      {/* ============ LIFECYCLE ============ */}
      <section className="sec sec-navy">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow-l">One record, a lifetime</div>
            <h2>Every stage generates a record. Today, each one lands somewhere else.</h2>
            <p className="lede-l">Most systems hold one slice of a Catholic life. The Catholic Family Record holds the journey — in the order it actually happens.</p>
          </div>

          <div className="orbit-wrap">
            <svg viewBox="0 0 880 640" role="img" xmlns="http://www.w3.org/2000/svg">
              <title>The Catholic family lifecycle, conception through legacy</title>
              <desc>Eight stages arranged on a ring around one Catholic Family Record, with a light travelling the ring continuously to show the cycle repeating in each generation.</desc>

              <circle cx="440" cy="320" r="200" fill="none" stroke="#D9B44A" strokeWidth="1" opacity=".28"/>

              <line x1="440" y1="224" x2="440" y2="130" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="507.9" y1="252.1" x2="574.4" y2="185.6" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="536" y1="320" x2="630" y2="320" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="507.9" y1="387.9" x2="574.4" y2="454.4" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="440" y1="416" x2="440" y2="510" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="372.1" y1="387.9" x2="305.6" y2="454.4" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="344" y1="320" x2="250" y2="320" stroke="#fff" strokeWidth="1" opacity=".14"/>
              <line x1="372.1" y1="252.1" x2="305.6" y2="185.6" stroke="#fff" strokeWidth="1" opacity=".14"/>

              <g id="orbit-light">
                <animateTransform attributeName="transform" type="rotate" from="0 440 320" to="360 440 320" dur="26s" repeatCount="indefinite"/>
                <circle cx="440" cy="120" r="20" fill="#D9B44A" opacity=".14"/>
                <circle cx="440" cy="120" r="7" fill="#F2D98A"/>
              </g>

              <circle cx="440" cy="320" r="86" fill="#0E3F4A"/>
              <circle cx="440" cy="320" r="92" fill="none" stroke="#D9B44A" strokeWidth="1" opacity=".55"/>
              <text x="440" y="303" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" letterSpacing="2.4" fill="#D9B44A">ONE</text>
              <text x="440" y="326" textAnchor="middle" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Catholic Family</text>
              <text x="440" y="348" textAnchor="middle" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Record</text>

              <circle cx="440" cy="120" r="13" fill="#D9B44A"/>
              <text x="440" y="124" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">1</text>
              <text x="440" y="82" textAnchor="middle" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Conception</text>
              <text x="440" y="62" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">The day a life begins</text>

              <circle cx="581.4" cy="178.6" r="13" fill="#D9B44A"/>
              <text x="581.4" y="182.6" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">2</text>
              <text x="614" y="172" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Baptism</text>
              <text x="614" y="191" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">The first record</text>

              <circle cx="640" cy="320" r="13" fill="#93A8C2"/>
              <text x="640" y="324" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">3</text>
              <text x="672" y="313" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Enrollment</text>
              <text x="672" y="332" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#D9B44A">School meets parish</text>

              <circle cx="581.4" cy="461.4" r="13" fill="#D9B44A"/>
              <text x="581.4" y="465.4" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">4</text>
              <text x="614" y="455" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Sacramental prep</text>
              <text x="614" y="474" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">Communion, Confirmation</text>

              <circle cx="440" cy="520" r="13" fill="#93A8C2"/>
              <text x="440" y="524" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">5</text>
              <text x="440" y="558" textAnchor="middle" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Student years</text>
              <text x="440" y="577" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">Formation and service</text>

              <circle cx="298.6" cy="461.4" r="13" fill="#93A8C2"/>
              <text x="298.6" y="465.4" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">6</text>
              <text x="266" y="455" textAnchor="end" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Young adult</text>
              <text x="266" y="474" textAnchor="end" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">The record becomes theirs</text>

              <circle cx="240" cy="320" r="13" fill="#D9B44A"/>
              <text x="240" y="324" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">7</text>
              <text x="208" y="313" textAnchor="end" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Marriage</text>
              <text x="208" y="332" textAnchor="end" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">A new household</text>

              <circle cx="298.6" cy="178.6" r="13" fill="#D9B44A"/>
              <text x="298.6" y="182.6" textAnchor="middle" fontFamily="'IBM Plex Mono',monospace" fontSize="10" fill="#081D3E">8</text>
              <text x="266" y="172" textAnchor="end" fontFamily="Newsreader,Georgia,serif" fontSize="17" fill="#ffffff">Parish life and legacy</text>
              <text x="266" y="191" textAnchor="end" fontFamily="Inter,sans-serif" fontSize="12.5" fill="#8FA3BC">A lifetime given, a good death</text>
            </svg>
          </div>
          <p className="orbit-cap">The ring does not end at stage eight. A family formed there conceives the next generation at stage one — and three generations meet in the same record.</p>

          <div className="life" style={{marginTop: '54px'}}>
            <div className="lf"><span className="lf-n">01</span><h4>Baptism</h4><p>The first record of a Catholic life. Minister, date, godparents, parish — recorded once.</p></div>
            <div className="lf inst"><span className="lf-n">02</span><h4>Inquiry</h4><p>A family asks about the school. The parish knows before enrollment, not months after.</p></div>
            <div className="lf inst"><span className="lf-n">03</span><h4>Enrollment</h4><p>School and parish meet on one household. The single moment no other Catholic platform connects.</p><span className="lf-tag moment">The CFR moment</span></div>
            <div className="lf"><span className="lf-n">04</span><h4>Sacramental preparation</h4><p>First Communion and Confirmation prep, visible to the classroom and the parish at once.</p></div>
            <div className="lf inst"><span className="lf-n">05</span><h4>Student years</h4><p>Formation, service, and family volunteering — the habit of giving time begins here.</p><span className="lf-tag">Time</span></div>
            <div className="lf inst"><span className="lf-n">06</span><h4>Graduation &amp; young adult</h4><p>The record does not end at eighth grade. It transfers to the adult it belongs to.</p><span className="lf-tag">Talent</span></div>
            <div className="lf"><span className="lf-n">07</span><h4>Marriage &amp; new household</h4><p>A new family, linked to both spouses' histories, registered from the marriage record itself.</p></div>
            <div className="lf"><span className="lf-n">08</span><h4>Parish life &amp; legacy</h4><p>Decades of ministry and generosity, and a good death prepared for — funeral wishes and intentions held with the family.</p><span className="lf-tag">Treasure</span></div>
          </div>

          <div className="life-key">
            <span><i style={{background: 'var(--navy-deep)', border: '1px solid rgba(255,255,255,.4)'}}></i>Sacramental milestone</span>
            <span><i style={{background: '#0A2A46', border: '1px solid rgba(255,255,255,.4)'}}></i>Institutional touchpoint</span>
          </div>

          <div className="narrow" style={{marginTop: '56px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,.16)', paddingTop: '44px'}}>
            <div className="eyebrow-l">And then it begins again</div>
            <h3 style={{margin: '12px 0 14px'}}>When that child's child is baptized, three generations meet in one record.</h3>
            <p className="lede-l">This is the thing no competitor can build and no diocese has ever had. Not a database of the living — a continuous account of a Catholic family in your diocese across generations. The diocese stops forgetting families.</p>
          </div>
        </div>
      </section>

      {/* ============ WHAT EXISTS ============ */}
      <section className="sec sec-paper" id="today">
        <div className="wrap">
          <div className="sec-head ctr">
            <div className="eyebrow">Said plainly, before anything else</div>
            <h2>What exists today, and what we are building with you.</h2>
            <p className="lede">A founding partnership is worth nothing if you cannot tell which parts are real. Here is the honest division. We would rather you hold us to it than discover it later.</p>
          </div>

          <div className="ladder">
            <div className="rung">
              <div className="rg-n">Available today</div>
              <h3>In service now</h3>
              <p>Running in Catholic schools and parishes across the country, and has been for years.</p>
              <ul>
                <li>School information and administration</li>
                <li>Parish records and administration</li>
                <li>Tuition, giving, and family payments</li>
                <li>Communication and emergency alerts</li>
              </ul>
            </div>
            <div className="rung">
              <div className="rg-n">Ready for pilot</div>
              <h3>The shared record</h3>
              <p>Ready to prove in one parish and one school during the founding year.</p>
              <ul>
                <li>One household shared by parish and school</li>
                <li>Sacramental history on the family record</li>
                <li>Permission scoping between institutions</li>
                <li>A single communication and alert list</li>
              </ul>
            </div>
            <div className="rung">
              <div className="rg-n">Built with the cohort</div>
              <h3>Shaped by founding dioceses</h3>
              <p>Specified with founding partners and delivered before go&#8209;live. Commitments, not things you can see today.</p>
              <ul>
                <li>Diocesan roll&#8209;up and mission reporting</li>
                <li>Records that follow a family between parishes</li>
                <li>Ministry, volunteer, and clearance management</li>
                <li>Family self&#8209;service and record access</li>
              </ul>
            </div>
          </div>

          <p className="narrow" style={{marginTop: '26px', fontSize: '15.5px', color: 'var(--muted)', textAlign: 'center'}}>Everything in the third column is why a founding cohort exists. You are not buying it as it stands. You are deciding what it becomes.</p>
        </div>
      </section>

      {/* ============ THE SEAM ============ */}
      <section className="sec" id="replace">
        <div className="wrap">
          <div className="sec-head">
            <div className="eyebrow">Boxes, and the space between them</div>
            <h2>Every system you run is a box. Nothing owns the space between the boxes.</h2>
            <p className="lede">Your systems are not badly built. The tuition system processes tuition correctly. The census system keeps a census. Each one does its job inside its own walls — and not one of them was ever responsible for the space in between, because no single-purpose vendor can be. That space is where your families go missing, and it has never had an owner.</p>
          </div>

          <div className="layers">
            <div className="lyr-top">
              <div className="lyr-lab">What each office runs — many, and rightly so</div>
              <div className="lyr-boxes">
                <span>Enrollment</span><span>Sacraments</span><span>Giving</span><span>Formation</span><span>Volunteers</span><span>Messaging</span>
              </div>
            </div>
            <div className="lyr-arrow" aria-hidden="true"></div>
            <div className="lyr-base">
              <div className="lyr-base-t">One Catholic Family Record</div>
              <div className="lyr-base-s">The record beneath every function. Functions can be many. The record cannot.</div>
            </div>
          </div>

          <p className="narrow" style={{marginTop: '26px', fontSize: '15.5px', color: 'var(--muted)', textAlign: 'center'}}>This is the whole architecture. Tools are plural by nature — offices need different ones and change them over time. A family is singular. The moment you have two records for one family, every problem on this page follows, and no amount of good software inside any one box will fix it.</p>

          <div className="seamless narrow" style={{background: 'var(--paper-2)', marginTop: '34px'}}>
            <div className="sl-e">Why this keeps happening</div>
            <h3>The system changes every few years. The history does not survive the change.</h3>
            <p>Have you ever wondered why parishes, schools, and dioceses keep replacing their management systems every few years &mdash; and what became of the records held in the last one? The answer is usually the same. Data that would not come cleanly out of the old system, and whatever did come out was never fully loaded into the new one. Years of history stranded in a secular platform the diocese no longer pays for, and a sacramental record that now begins on the day the current system went live.</p>
            <p>That is not poor judgment, and it is not restlessness. It is what happens when a Catholic institution is asked to run on something built for somebody else. A school is handed a system designed for a public district, where sacramental milestones become custom fields and the parish connection becomes a manual report. A parish is handed one designed for congregational churches, where there is no register to notate, no OCIA, no territory, and a parishioner is modeled as a donor. The fit is wrong from the first week, so in a few years someone reasonably tries a different one &mdash; and the diocese pays for the change in the only currency it cannot replace.</p>
            <p>The churn is not the problem. The churn is the symptom of asking a tool to serve as a record. Tools should change; offices need different ones and their needs move. A record should not, because it is the one thing here that took generations to accumulate and cannot be bought back.</p>
            <p>The churn ends when the tools are built for the Church to begin with &mdash; when they assume a sacramental register, a parish territory, a catechumen, a family formed across a school and a parish at once. Software that shares the Church&rsquo;s purpose does not need replacing every few years, because it was never the wrong shape. And only then does the record become what it was always meant to be: a foundation steady enough to build on, so a diocese can stop tending its systems and give its attention to catechesis, evangelization, and the growth of the Church.</p>
          </div>
        </div>
      </section>

      {/* ============ THE COUNT ============ */}
      <section className="sec sec-paper">
        <div className="wrap">
          <div className="sec-head ctr">
            <div className="eyebrow">What fragmentation costs before anyone logs in</div>
            <h2>Count what your diocese manages, not what it uses.</h2>
            <p className="lede">Software is the smallest line in this. The real cost is everything that has to happen around it, every year, in every office, forever.</p>
          </div>

          <div className="count narrow">
            <div className="eyebrow" style={{margin: '14px 0 4px'}}>Illustrative &middot; a mid&#8209;sized diocese today</div>
            <div className="count-row"><span>Vendor contracts to negotiate and renew</span><span className="cv">11</span></div>
            <div className="count-row"><span>Separate renewal dates to track</span><span className="cv">9</span></div>
            <div className="count-row"><span>Support lines to call when something breaks</span><span className="cv">6</span></div>
            <div className="count-row"><span>Security and privacy reviews each year</span><span className="cv">6</span></div>
            <div className="count-row"><span>Data exports and reconciliations</span><span className="cv">4</span></div>
            <div className="count-row"><span>Systems that hold your families</span><span className="cv">1</span></div>
            <div className="count-out">License fees are the smallest line on this list. Every other row is somebody's week.</div>
          </div>
        </div>
      </section>

      {/* ============ BUILT TO YOUR DIOCESE ============ */}
      <section className="sec sec-teal">
        <div className="wrap">
          <div className="sec-head" style={{maxWidth: '820px'}}>
            <div className="eyebrow-l">The founding difference</div>
            <h2>You are not buying a catalog. You are writing one.</h2>
            <p className="lede-l">No national vendor will build something for one diocese. Their roadmap is set by a market, and your diocese is one voice among thousands in it. Ours is set by a founding cohort small enough that every member is in the room — and there is time to do it properly before you go live.</p>
          </div>

          <div className="build">
            <div className="bd">
              <div className="bd-w">Autumn 2026 &ndash; spring 2027</div>
              <h4>The cohort specifies</h4>
              <p>Founding dioceses meet as a group and decide what the record must do for a diocese — jointly, so the roadmap serves all of you rather than fragmenting across each of you.</p>
            </div>
            <div className="bd">
              <div className="bd-w">Spring 2027 &ndash; summer 2027</div>
              <h4>We build to it</h4>
              <p>What the cohort prioritizes gets built, and each diocese is configured to its own governance — parish-governed schools and diocesan schools are not the same thing and are not treated as such.</p>
            </div>
            <div className="bd">
              <div className="bd-w">2027&ndash;28 school year</div>
              <h4>You go live on it</h4>
              <p>Not on a product built for someone else and adapted to you. On one shaped around how your diocese actually works, with a full year of specification behind it.</p>
            </div>
          </div>

          <div className="narrow" style={{marginTop: '44px', borderTop: '1px solid rgba(255,255,255,.16)', paddingTop: '32px'}}>
            <h3 style={{fontSize: '22px', marginBottom: '14px'}}>How a first year actually runs</h3>
            <p className="lede-l" style={{fontSize: '16px', marginBottom: '12px'}}><strong style={{color: '#fff'}}>One parish, one school.</strong> A single pair moves onto the record while everything else in the diocese keeps running exactly as it does today. Nobody bets a diocese on a summer.</p>
            <p className="lede-l" style={{fontSize: '16px', marginBottom: '12px'}}><strong style={{color: '#fff'}}>Prove it in one school year.</strong> Two offices, one record, a full academic year. If it does not visibly give those two offices their week back, it should not be extended, and we will say so first.</p>
            <p className="lede-l" style={{fontSize: '16px'}}><strong style={{color: '#fff'}}>Expand at your pace.</strong> Each additional parish and school comes on when its pastor and principal are ready and its current agreements allow, with a named specialist for every move.</p>
          </div>
        </div>
      </section>

      {/* ============ THESIS ============ */}
      <section className="sec">
        <div className="wrap">
          <div className="thesis">
            <div className="eyebrow">The decision in front of you</div>
            <h2>A platform is a mission decision, not an IT one.</h2>
            <p>Procurement asks which box is best. Asked carefully, category by category, year after year, that question is precisely how a diocese ends up with eleven of them — each one a sound choice, and all of them together the reason nobody can see a family whole.</p>
            <p>The better question is what becomes possible once a family stops being scattered. A school that is genuinely the parish&rsquo;s front door. A diocese that no longer loses the family who moved four miles. Offices that get their weeks back for catechesis and evangelization &mdash; the work that actually grows the Church, and the work that fragmentation has been quietly taxing for twenty years.</p>
            <p className="th-last">The Catholic Family Record is not a better box. It is the thing that was always missing between them.</p>
          </div>
        </div>
      </section>

      {/* ============ FOUNDING ============ */}
      <section className="sec" id="founding">
        <div className="wrap">
          <div className="offer">
            <div className="offer-in">
              <div className="eyebrow-l">By invitation · A small founding cohort</div>
              <h2>Become a Founding CFR Diocese.</h2>
              <p className="lede-l" style={{maxWidth: '62ch'}}>We are opening the Catholic Family Record to a small group of founding dioceses — the first to bring their schools and parishes onto one record, and the ones who will decide what it becomes. Founding partners are not early customers. They are co-authors.</p>

              <div className="terms">
                <div className="term lead"><h4>50% off for two years</h4><p>Founding pricing across parishes and PreK–8 schools, held for two full years from your start date.</p></div>
                <div className="term"><h4>Dedicated onboarding</h4><p>A named specialist for your migration, working directly with each parish and school office.</p></div>
                <div className="term"><h4>Product influence</h4><p>Your diocese's needs shape the roadmap. Founding partners meet with us on it directly.</p></div>
                <div className="term"><h4>Priority support</h4><p>A direct line to our team, not a queue, for the length of the founding term.</p></div>
                <div className="term"><h4>Early access</h4><p>Ministry modules and diocesan reporting reach founding dioceses first.</p></div>
                <div className="term"><h4>A pilot, not a leap</h4><p>Begin with one parish and one school. Expand only when it has proven itself.</p></div>
              </div>

              <div className="offer-actions">
                <a className="btn" href="#talk">Request a Discovery Session</a>
                <a className="btn-o" href="mailto:CatholicInnovation@OptionC.com">Email us directly</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="sec sec-paper">
        <div className="wrap">
          <div className="sec-head ctr">
            <div className="eyebrow">Questions we are asked first</div>
            <h2>The hard ones, answered plainly.</h2>
          </div>
          <div className="faq narrow">
            <details><summary>Who owns the data?</summary><div className="fa"><p>The diocese and its institutions own their institutional records. The family owns its personal record. We do not sell your data and we do not broker it to anyone. If you leave, you leave with a complete export in an open format — a commitment that belongs in your contract, not only on a website.</p></div></details>

            <details><summary>Our parishes share a school and will not share data with each other. Can this work?</summary><div className="fa"><p>Yes, and it is the case we designed for. Identity and sacramental information is shared; giving history, tuition assistance, and pastoral notes never cross a parish boundary. Scope is enforced in the data layer rather than hidden in the interface, and every access is logged so a pastor can audit exactly who opened his families' records.</p></div></details>

            <details><summary>Does this hand the chancery control over my parish?</summary><div className="fa"><p>No. The record changes what each office can see, not who decides anything. A parish school remains the pastor's to govern, and diocesan offices gain visibility into totals and trends rather than authority over decisions. Nothing in the platform creates a reporting line that your diocesan policy does not already establish.</p><p>We built it on subsidiarity deliberately, because a system that quietly centralizes authority would be resisted by exactly the pastors it needs, and rightly so. Permissions are configured to match your diocese's actual governance — not the other way around.</p></div></details>

            <details><summary>Does this replace our sacramental registers?</summary><div className="fa"><p>No. The canonical register remains the parish's, kept as canon law requires. The Catholic Family Record is the index and the notation flow around it — so a record can be found, verified, and shared without anyone driving to a parish basement, and so it survives a merger or a closure.</p></div></details>

            <details><summary>Do you track whether families attend Mass?</summary><div className="fa"><p>No. We considered it and decided against it. A system that quietly monitors your parishioners' religious practice would cost more trust than any report it produced could return. The Catholic Family Record holds records families give and sacraments the Church confers — not surveillance of the faithful.</p><p>The distinction runs deeper than privacy. A secular platform can only measure engagement, because measuring is all it was ever built to do — it has no stake in what happens next. Ours is built for the work the Church is actually doing: connecting a school family to OCIA, tying formation to the classroom, making sure a child preparing for Confirmation is known by the parish and the school at once. We are not here to score your parishioners. We are here to help you catechize and evangelize them.</p></div></details>

            <details><summary>How long does implementation take, honestly?</summary><div className="fa"><p>A single parish and school pilot runs in a term. A full diocese is a multi-year program, and any vendor who tells you otherwise is selling you something. The connect-first approach means you get the unified view early without waiting for the full migration.</p></div></details>

            <details><summary>Can a school participate if its parish is not ready?</summary><div className="fa"><p>Yes. Schools and parishes can each start alone. The record is built so the connection can be made later, without re-entering anything, whenever the other office is ready.</p></div></details>

            <details><summary>Is our data secure?</summary><div className="fa"><p>The record holds sacramental history and identity documents, which is identity-theft-grade information, and it is treated that way: encrypted in transit and at rest, scope enforced at the data layer, every access audit-logged, and sharing that is explicit, time-limited, and revocable by the family. Our full security documentation is provided during a Discovery Session.</p></div></details>
          </div>
        </div>
      </section>

      {/* ============ CONTACT ============ */}
      <section className="sec" id="talk">
        <div className="wrap">
          <div className="contact">
            <div>
              <div className="eyebrow">The next step</div>
              <h2 style={{margin: '12px 0 18px'}}>See your diocese whole.</h2>
              <p className="lede" style={{marginBottom: '26px'}}>A Discovery Session puts your chancery, your superintendent, and your parish leadership in front of the same family on one record — across every stage, every institution, and every office that currently keeps its own list. Ninety minutes, built around your diocese, not a demo reel.</p>
              <div className="cmeta">
                CatholicInnovation@OptionC.com<br />
                855.822.8418
              </div>
            </div>
            <div>
              <form id="dsform" noValidate onSubmit={onSubmit} onFocus={onFormFocus}>
                <div className="crow">
                  <div className="cfield">
                    <label htmlFor="n">Name</label>
                    <input
                      id="n"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Margaret Chen"
                      required
                    />
                  </div>
                  <div className="cfield">
                    <label htmlFor="e">Email</label>
                    <input
                      id="e"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="e.g. mchen@archdiocese.org"
                      required
                    />
                  </div>
                </div>
                <div className="crow">
                  <div className="cfield">
                    <label htmlFor="o">Diocese, parish, or school</label>
                    <input
                      id="o"
                      name="organization"
                      type="text"
                      autoComplete="organization"
                      placeholder="e.g. Archdiocese of St. Louis"
                      required
                    />
                  </div>
                  <div className="cfield">
                    <label htmlFor="r">Your role</label>
                    <select id="r" name="role" required defaultValue="">
                      <option value="" disabled>
                        Select your role — e.g. Pastor
                      </option>
                      <option>Bishop&#39;s office</option>
                      <option>Vicar general</option>
                      <option>Chief financial officer</option>
                      <option>Superintendent of schools</option>
                      <option>Chancery director</option>
                      <option>Pastor</option>
                      <option>Principal</option>
                      <option>Parish business manager</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div className="cfield">
                  <label htmlFor="m">What would you want a session to answer?</label>
                  <textarea
                    id="m"
                    name="message"
                    placeholder="e.g. How would one shared record work across our parish and school offices?"
                  />
                </div>
                <button className="cbtn" type="submit" disabled={btnDisabled}>{btnLabel}</button>
                <p id="dsnote" className={`cnote${note.cls ? ` ${note.cls}` : ''}`} role="status">{note.text}</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="fm">One family. One record. One faith.</div>
          <div>Serving Catholic schools and parishes for over 20 years · optionc.com</div>
        </div>
      </footer>
    </div>
  )
}
