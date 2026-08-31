import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  btn,
  btnGhost,
  callout,
  card,
  eyebrow,
  fieldInput,
  fieldLabel,
  heading1,
  heading2,
  heading3,
  lede,
  narrow,
  navLink,
  page,
  section,
  sectionAlt,
  sectionHead,
  sectionHeadCenter,
  sectionWash,
  wrap,
} from '../components/landing/tw'
const CONTACT_EMAIL = 'CatholicInnovation@OptionC.com'

let pageViewSent = false
let formStartSent = false

function SectionHead({
  kicker,
  title,
  children,
  center = false,
}: {
  kicker: string
  title: ReactNode
  children?: ReactNode
  center?: boolean
}) {
  return (
    <div className={center ? sectionHeadCenter : sectionHead} data-reveal>
      <p className={eyebrow}>{kicker}</p>
      <h2 className={heading2}>{title}</h2>
      {children ? <p className={`${lede}${center ? ' mx-auto' : ''}`}>{children}</p> : null}
    </div>
  )
}

function CostItem({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2 border-b border-stone-200 py-6 md:grid-cols-[15rem_1fr] md:gap-8">
      <dt className="font-serif text-xl text-slate-900">
        {title}
        {note ? (
          <span className="mt-1 block text-base font-semibold uppercase tracking-wide text-amber-800">
            {note}
          </span>
        ) : null}
      </dt>
      <dd className="text-lg leading-relaxed text-slate-600">{children}</dd>
    </div>
  )
}

function StageCard({
  kicker,
  title,
  intro,
  items,
}: {
  kicker: string
  title: string
  intro: string
  items: string[]
}) {
  return (
    <div className={`${card} border-t-4 border-t-amber-800`} data-reveal>
      <p className={eyebrow}>{kicker}</p>
      <h3 className={`${heading3} mt-3`}>{title}</h3>
      <p className="mt-2 text-lg text-slate-600">{intro}</p>
      <ul className="mt-4 space-y-2 text-lg text-slate-800">
        {items.map((item) => (
          <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-2.5 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-800">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function StatRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`grid grid-cols-1 gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-baseline ${
        last ? 'border-b-2 border-slate-900 font-semibold' : 'border-b border-stone-200'
      }`}
    >
      <span>{label}</span>
      <span className="text-xl font-semibold text-slate-900">{value}</span>
    </div>
  )
}

function Callout({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <div className={`${callout} ${narrow}`}>
      <p className={eyebrow}>{kicker}</p>
      <h3 className={`${heading3} mt-2`}>{title}</h3>
      <div className="mt-3 space-y-3 text-lg leading-relaxed text-slate-600">{children}</div>
    </div>
  )
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <details className="border-b border-stone-200">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-serif text-xl text-slate-900 marker:content-none [&::-webkit-details-marker]:hidden">
        {q}
        <span className="text-2xl text-amber-800">+</span>
      </summary>
      <div className="max-w-3xl space-y-3 pb-5 text-lg leading-relaxed text-slate-600">{children}</div>
    </details>
  )
}

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [note, setNote] = useState({ text: '', ok: false })
  const [btnLabel, setBtnLabel] = useState('Request a Discovery Session')
  const [btnDisabled, setBtnDisabled] = useState(false)
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
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return

    els.forEach((el) => {
      el.classList.add('opacity-0', 'translate-y-2', 'transition', 'duration-200', 'ease-out')
    })
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement
            el.classList.remove('opacity-0', 'translate-y-2')
            io.unobserve(el)
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
      setNote({ text: 'Please complete name, email, organization, and role.', ok: false })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNote({ text: 'That email address does not look right.', ok: false })
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
      setNote({ text: 'Thank you. We will be in touch to arrange a session.', ok: true })
    } catch {
      setBtnDisabled(false)
      setBtnLabel('Request a Discovery Session')
      setNote({
        text: `That did not send. Please email ${CONTACT_EMAIL} and we will pick it up from there.`,
        ok: false,
      })
    }
  }

  return (
    <div ref={rootRef} className={page}>
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="flex min-h-[68px] items-center gap-4 px-4 sm:px-6">
          <div className="min-w-0 shrink font-serif text-lg font-semibold text-slate-900 sm:text-xl">
            The Catholic Family <span className="text-amber-800">Record</span>
          </div>
          <div className="ml-auto hidden items-center gap-5 text-slate-600 xl:flex">
            <a className={navLink} href="#problem">The problem</a>
            <a className={navLink} href="#today">What exists</a>
            <a className={navLink} href="#parish">Parish &amp; school</a>
            <a className={navLink} href="#diocese">Diocese</a>
            <a className={navLink} href="#replace">Replacing your stack</a>
            <a className={navLink} href="#founding">Founding program</a>
          </div>
          <a className={`${btn} ml-auto shrink-0 xl:ml-0`} href="#talk">
            Discuss a partnership
          </a>
        </div>
      </nav>

      <header className="bg-stone-50 pb-6 pt-16 sm:pt-20">
        <div className={wrap}>
          <p className={eyebrow}>OptionC · Serving Catholic schools and parishes for over 20 years</p>
          <h1 className={heading1}>
            Your diocese knows every family. <span className="italic text-amber-800">In pieces.</span>
          </h1>
          <p className={lede}>
            The school holds one record. The parish holds another. Giving holds a third, the
            emergency list a fourth, the diocesan mailing list a fifth. Nobody is doing anything
            wrong — and no one can see the family whole. The Catholic Family Record makes them one,
            and gives your staff back the hours that fragmentation quietly costs.
          </p>
          <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
            <a className={card} href="#parish">
              <span className={`${eyebrow} block`}>Start here</span>
              <span className="mt-1 block font-serif text-2xl text-slate-900">I lead a parish or a school</span>
              <span className="mt-1 block text-lg text-slate-500">The office work this ends, starting Monday</span>
            </a>
            <a className={card} href="#diocese">
              <span className={`${eyebrow} block`}>Start here</span>
              <span className="mt-1 block font-serif text-2xl text-slate-900">I lead a diocese</span>
              <span className="mt-1 block text-lg text-slate-500">What fragmentation costs every chancery office</span>
            </a>
          </div>
          <p className="mt-12 border-t border-stone-200 py-4 text-base font-semibold uppercase tracking-wide text-slate-500">
            One family · One record · One faith
          </p>
        </div>
      </header>

      <section className={section} id="problem">
        <div className={wrap}>
          <SectionHead
            kicker="The problem, as it actually happens"
            title="The same family, entered six times, by six people who will never meet."
          >
            A family joins your parish and enrolls a child in your school. Here is what that costs
            your staff this week — before anyone has taught a class, prepared a homily, or visited a
            home.
          </SectionHead>

          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white" data-reveal>
            <div className="flex justify-between bg-stone-100 px-5 py-3 text-base font-semibold uppercase tracking-wide text-slate-600">
              <span>Register of entry — one household</span>
              <span>Tuesday</span>
            </div>
            {[
              ['School SIS', 'Kowalski, Anna & Michael', '9:40 a.m.'],
              ['Parish census', 'Kowalski, Michael & Anna', '11:15 a.m.'],
              ['Diocesan newspaper', 'Kowalski, M.', '1:20 p.m.'],
              ['Giving platform', 'Kowalsky, Michael', '2:05 p.m.'],
              ['Emergency list', 'Kowalski family', '3:30 p.m.'],
              ['Volunteer roster', 'A. Kowalski', '4:45 p.m.'],
            ].map(([sys, name, time]) => (
              <div key={sys} className="grid gap-1 border-b border-stone-100 px-5 py-3 sm:grid-cols-[9rem_1fr_8rem]">
                <span className="text-base font-semibold text-slate-500">{sys}</span>
                <span className="font-serif text-xl text-slate-900">{name}</span>
                <span className="text-base text-slate-500 sm:text-right">{time}</span>
              </div>
            ))}
            <p className="bg-amber-50 px-5 py-4 text-lg text-amber-950">
              Six entries. One misspelling that will never be caught. When Anna's mobile number
              changes in March, five of these six will still be wrong in June — including the one
              the school would use in an emergency.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-stone-200 bg-white" data-reveal>
            <div className="flex justify-between bg-stone-100 px-5 py-3 text-base font-semibold uppercase tracking-wide text-slate-600">
              <span>With the Catholic Family Record</span>
              <span>Tuesday</span>
            </div>
            <div className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr_8rem]">
              <span className="text-base font-semibold text-slate-500">Entered once</span>
              <span className="font-serif text-xl font-semibold text-slate-900">Kowalski, Anna &amp; Michael</span>
              <span className="text-base text-slate-500 sm:text-right">9:40 a.m.</span>
            </div>
            <p className="bg-amber-50 px-5 py-4 text-lg text-amber-950">
              Enrollment, parish registration, tuition, giving, alerts, and volunteering all read
              the same record. Anna changes her number once, in March, and every office has it that
              afternoon.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionAlt}>
        <div className={wrap}>
          <SectionHead
            kicker="Why this is a mission problem"
            title={
              <>
                The hours are not the point. What the hours were <em className="italic text-amber-800">supposed to be</em> is the point.
              </>
            }
          >
            Nobody entered ministry to re-key a phone number. Duplicate data entry is not an
            inconvenience your staff absorbs — it is catechesis, OCIA follow-up, home visits, and
            sacramental preparation that quietly does not happen, in every parish, every week,
            forever.
          </SectionHead>
          <div className={`${narrow} rounded-r-lg border border-stone-200 border-l-4 border-l-amber-800 bg-white p-6 sm:p-8`} data-reveal>
            <p className={`${eyebrow} mb-4`}>Illustrative · a diocese of ninety parishes</p>
            <StatRow label="Hours a parish office recovers each week" value="6" />
            <StatRow label="Weeks in the working year" value="48" />
            <StatRow label="Parishes in the diocese" value="90" />
            <StatRow label="Hours returned to ministry, per year" value="25,920" last />
            <p className="mt-5 font-serif text-2xl leading-snug text-slate-900">
              That is roughly <strong>thirteen full-time people</strong> given back to the diocese —
              not hired, not budgeted for, just recovered from work the software should never have
              created.
            </p>
          </div>
        </div>
      </section>

      <section className={section} id="parish">
        <div className={wrap}>
          <SectionHead
            kicker="For pastors, principals, and business managers"
            title="What one shared record ends."
          >
            Not features. Failures — the specific, recurring ones your office has stopped noticing
            because they have always been true.
          </SectionHead>
          <dl className="border-t border-stone-200" data-reveal>
            <CostItem title="Driving for a certificate">
              A Confirmation candidate needs a baptismal record from a parish two towns over. Someone
              calls, waits, then gets in a car. With one record, the certificate is already attached
              to the family, verified by the issuing parish.
            </CostItem>
            <CostItem title="The notice nobody read">
              A family with three children receives the same closure announcement four times, from
              four lists — and still misses the one that mattered, because the list with the current
              number was the one nobody updated.
            </CostItem>
            <CostItem title="Begging for catechists">
              The parish pleads for volunteers in the bulletin while the school already knows exactly
              which parents show up. Two rosters, one community, no connection between them.
            </CostItem>
            <CostItem title="Strangers in March">
              A family enrolls in September and registers at the parish in March — as new people,
              filling out the same form again. The school was the parish's front door and nobody was
              standing in it.
            </CostItem>
            <CostItem title="The family nobody invited" note="The one that matters most">
              A non-Catholic family spends four years on your campus, at every Christmas concert and
              every fundraiser, and is never personally invited into the life of the parish — because
              the person who runs OCIA has no idea they exist.
            </CostItem>
          </dl>
        </div>
      </section>

      <section className={sectionAlt}>
        <div className={wrap}>
          <SectionHead
            kicker="The question every pastor asks first"
            title="Shared where it should be. Separate where it must be."
          >
            One school, supported by three parishes, where the pastors are not about to share giving
            data with one another. That is not an edge case — it is the direction Catholic education
            is moving. The record belongs to the family, not the institution, and every office sees
            only what it has a reason to see.
          </SectionHead>
          <div className="overflow-x-auto" data-reveal>
            <table className="min-w-[40rem] w-full border border-stone-200 bg-white text-lg">
              <thead className="bg-stone-100 text-base font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-3 text-left">Information</th>
                  <th className="px-3 py-3">The family</th>
                  <th className="px-3 py-3">This parish</th>
                  <th className="px-3 py-3">Partner parish</th>
                  <th className="px-3 py-3">The school</th>
                  <th className="px-3 py-3">Diocese</th>
                </tr>
              </thead>
              <tbody className="text-center">
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Family identity &amp; contact</th>
                  <td className="px-3 py-3 font-bold text-green-800">Manages it</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                </tr>
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Sacramental record</th>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-semibold text-amber-800">On request</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                </tr>
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Enrollment &amp; academics</th>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-semibold text-amber-800">Totals only</td>
                </tr>
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Giving history</th>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-semibold text-amber-800">Totals only</td>
                </tr>
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Tuition assistance</th>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                </tr>
                <tr className="border-t border-stone-100">
                  <th className="px-3 py-3 text-left font-semibold text-slate-800">Pastoral notes</th>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-green-800">Yes</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                  <td className="px-3 py-3 font-bold text-red-800">No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={`${narrow} mt-6 text-center text-lg text-slate-600`}>
            Scope is enforced in the data layer, not hidden in the interface, and every access is
            logged. A pastor can see precisely who opened his families' records and when.
          </p>
          <Callout kicker="The case that runs the other way" title="Safe environment is where boxing information becomes the danger.">
            <p>A volunteer's clearance is a fact about a person, not a record belonging to one office. She completes her training, her background check, her fingerprinting — once. The parish that cleared her, the school where she coaches on Saturdays, and the diocese that must account for her all see the same status and the same expiry date, because it is the same fact.</p>
            <p>She is not processed twice for the same year. She does not start over when her family moves to a parish across the diocese. And nobody discovers in October that her certification lapsed in April, because the record that holds her clearance is the record every office is already looking at.</p>
            <p>This is the same permission model doing the opposite job. Giving history stops at the parish boundary because it should. Compliance crosses every boundary because it must. A system that cannot tell those two apart will get one of them wrong.</p>
          </Callout>
          <Callout kicker="The column that is usually missing" title="The one person who cannot reach the record is the person it belongs to.">
            <p>Most parish systems treat a parishioner as the subject of a record rather than a participant in it. A new phone number, a change of address, a child gone off to college, a willingness to serve on a Saturday — all of it has to travel through a staff member who is already underwater. The office becomes the bottleneck for information it does not own and never asked to hold.</p>
            <p>Every January the same three weeks arrive: hundreds of contribution statement requests, each handled by hand, every one of them urgent because people are filing. Not one of them needed a person.</p>
            <p>And a thirty-four-year-old who manages her mortgage, her pediatrician, and her child's lunch account from her phone will not call a parish office between nine and three. She is not disengaged. She has been handed the one institution in her life that still requires a phone call, and she drifts without ever deciding to. Friction is never neutral — when volunteering means noticing a bulletin notice and calling during business hours, the parish has built a filter that screens out working parents, who are precisely the families most likely to give and most likely to stay.</p>
            <p>The Church teaches stewardship as participation. A system in which a parishioner can only ever receive — never update, never volunteer, never see their own giving — quietly makes participation something done to them. This record is built the other way around. The family holds its own, keeps it current, prints its own statements, and steps forward to serve without needing to ask anyone first.</p>
          </Callout>
        </div>
      </section>

      <section className={section}>
        <div className={wrap}>
          <SectionHead kicker="How this grows" title="Start where you are. Grow into the whole diocese.">
            No diocese replaces six systems in a summer, and we will not ask you to. Begin with the
            pain everyone already feels. The rest is already built when you are ready for it.
          </SectionHead>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <StageCard
              kicker="Stage one"
              title="Parish and school"
              intro="One record shared between the two offices that already serve the same families."
              items={[
                'Enrollment and parish registration on one household',
                'Sacramental history connected to the classroom',
                'One communication list, one emergency list',
                'Tuition and offertory in a single family view',
              ]}
            />
            <StageCard
              kicker="Stage two"
              title="The ministries join"
              intro="Every ministry currently keeping its own list stops keeping its own list."
              items={[
                'Volunteers and ministry scheduling',
                'Altar servers and server formation',
                'Faith formation, OCIA, and sacramental prep',
                'Music ministry and parish societies',
                'Safe environment training and clearances',
              ]}
            />
            <StageCard
              kicker="Stage three"
              title="The diocese connects"
              intro="Every parish and school rolls up, and families stop disappearing when they move."
              items={[
                'Mission reporting across all institutions',
                'A family who moves stays known',
                'Sacramental records survive a merger or closure',
                'One reach for diocesan communication and alerts',
              ]}
            />
          </div>
          <div className={`${callout} mt-8 border-l-slate-900`} data-reveal>
            <p className="font-serif text-2xl leading-snug text-slate-900 sm:text-3xl">
              Nationally, volunteers donate to charity at roughly twice the rate of non-volunteers —
              about 80 percent, against 40 percent of non-volunteers.
            </p>
            <p className="mt-3 text-lg text-slate-600">
              Service and generosity tend to travel together. Yet in most parishes the ministry
              roster and the offertory record sit in systems that have never been introduced, so a
              parish cannot easily thank, form, or invite the people already giving it their
              Saturdays. Stage two is where that stops.
            </p>
            <p className="mt-4 border-t border-stone-200 pt-3 text-base text-slate-500">
              Source · Volunteering and Civic Life in America, AmeriCorps with the U.S. Census Bureau.
              <br />
              Association, not causation — generous people tend to do both. The record makes the
              overlap visible; it does not manufacture generosity.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionAlt} id="diocese">
        <div className={wrap}>
          <SectionHead
            kicker="For the bishop's office"
            title="Fragmentation does not stop at the parish. It reaches every office in the chancery."
          >
            Each of these is a director who has already built a workaround — a spreadsheet, a phone
            call, a folder. The workarounds are the tell. Every one of them exists because no system
            holds the family whole.
          </SectionHead>
          <dl className="border-t border-stone-200" data-reveal>
            <CostItem title="Safe environment" note="Liability, not convenience">
              Volunteer clearances and training tracked parish by parish, in spreadsheets, with no
              diocesan view of who is currently compliant and who lapsed in April. This is the office
              where fragmentation stops being an inefficiency and becomes an exposure.
            </CostItem>
            <CostItem title="Tribunal & marriage prep">
              Cases wait on baptismal and confirmation records held by a parish that may since have
              merged, closed, or boxed its registers. Weeks of delay, entirely clerical.
            </CostItem>
            <CostItem title="Vocations">
              No way to follow a young person from Catholic school through youth ministry into young
              adulthood. The office charged with finding the next generation of priests cannot see
              them.
            </CostItem>
            <CostItem title="Development & annual appeal">
              The same household solicited three times under three spellings, at two addresses. No
              way to distinguish a lapsed donor from a family that simply moved across town.
            </CostItem>
            <CostItem title="Superintendent of schools" note="Support, not oversight">
              In a parish school the pastor governs and the superintendent advises — and an advisor
              working without shared data can only offer generalities. Today a superintendent usually
              learns a school is in enrollment trouble when the pastor tells him, a year after it
              could have been acted on. One record lets him bring a pastor early warning, comparable
              benchmarks, and the experience of every other school facing the same thing. What the
              pastor does with it remains the pastor's decision.
            </CostItem>
            <CostItem title="Evangelization & OCIA">
              Programs designed in the dark, blind to the non-Catholic families already on Catholic
              campuses every single day — the warmest prospects in the diocese, invisible to the
              office whose job they are.
            </CostItem>
            <CostItem title="Catholic Charities">
              Serving families the parish never knew were in need, while the parish serves families
              Charities never knew it was already helping.
            </CostItem>
            <CostItem title="Communications & emergency">
              No way to reach the diocese without rebuilding the list, and no confidence the list is
              current when it matters most.
            </CostItem>
          </dl>
        </div>
      </section>

      <section className={sectionWash}>
        <div className={`${wrap} ${narrow} text-center`}>
          <p className={eyebrow}>The record that follows</p>
          <h2 className={`${heading2} mt-3`}>A family moves across town and vanishes.</h2>
          <p className={`${lede} mx-auto`}>
            They were registered at St. Mary's for eleven years. Three children baptized, two
            confirmed, a decade of offertory. They move four miles, to a parish in the same diocese,
            under the same bishop — and arrive as strangers. Nobody at Holy Cross knows they are
            coming. Nobody at St. Mary's knows they left. If they never quite get around to
            registering, the diocese records it as attrition, and no one can tell the difference
            between a family that left the Church and a family that changed address.
          </p>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-amber-800">
            One record in the diocese means the family is known before they walk in — and the
            difference between moving and leaving is finally visible.
          </p>
        </div>
      </section>

      <section className={sectionWash}>
        <div className={wrap}>
          <SectionHead
            kicker="One record, a lifetime"
            title="Every stage generates a record. Today, each one lands somewhere else."
          >
            Most systems hold one slice of a Catholic life. The Catholic Family Record holds the
            journey — in the order it actually happens.
          </SectionHead>
          <div className="mx-auto max-w-4xl">
            <svg viewBox="0 0 880 640" role="img" xmlns="http://www.w3.org/2000/svg" className="h-auto w-full">
              <title>The Catholic family lifecycle, conception through legacy</title>
              <desc>
                Eight stages arranged on a ring around one Catholic Family Record, with a light
                travelling the ring continuously to show the cycle repeating in each generation.
              </desc>

              <circle cx="440" cy="320" r="200" fill="none" className="stroke-amber-800/40" strokeWidth="1" />

              <line x1="440" y1="224" x2="440" y2="130" className="stroke-stone-300" strokeWidth="1" />
              <line x1="507.9" y1="252.1" x2="574.4" y2="185.6" className="stroke-stone-300" strokeWidth="1" />
              <line x1="536" y1="320" x2="630" y2="320" className="stroke-stone-300" strokeWidth="1" />
              <line x1="507.9" y1="387.9" x2="574.4" y2="454.4" className="stroke-stone-300" strokeWidth="1" />
              <line x1="440" y1="416" x2="440" y2="510" className="stroke-stone-300" strokeWidth="1" />
              <line x1="372.1" y1="387.9" x2="305.6" y2="454.4" className="stroke-stone-300" strokeWidth="1" />
              <line x1="344" y1="320" x2="250" y2="320" className="stroke-stone-300" strokeWidth="1" />
              <line x1="372.1" y1="252.1" x2="305.6" y2="185.6" className="stroke-stone-300" strokeWidth="1" />

              <g id="orbit-light">
                <animateTransform attributeName="transform" type="rotate" from="0 440 320" to="360 440 320" dur="26s" repeatCount="indefinite" />
                <circle cx="440" cy="120" r="20" className="fill-amber-800/20" />
                <circle cx="440" cy="120" r="7" className="fill-amber-500" />
              </g>

              <circle cx="440" cy="320" r="86" className="fill-white" />
              <circle cx="440" cy="320" r="92" fill="none" className="stroke-amber-800" strokeWidth="1.5" />
              <text x="440" y="303" textAnchor="middle" className="fill-amber-800" fontSize="11" fontWeight="600" letterSpacing="2.4">ONE</text>
              <text x="440" y="326" textAnchor="middle" className="fill-slate-900" fontSize="17">Catholic Family</text>
              <text x="440" y="348" textAnchor="middle" className="fill-slate-900" fontSize="17">Record</text>

              <circle cx="440" cy="120" r="13" className="fill-amber-800" />
              <text x="440" y="124" textAnchor="middle" className="fill-white" fontSize="10">1</text>
              <text x="440" y="82" textAnchor="middle" className="fill-slate-900" fontSize="17">Conception</text>
              <text x="440" y="62" textAnchor="middle" className="fill-slate-500" fontSize="13">The day a life begins</text>

              <circle cx="581.4" cy="178.6" r="13" className="fill-amber-800" />
              <text x="581.4" y="182.6" textAnchor="middle" className="fill-white" fontSize="10">2</text>
              <text x="614" y="172" className="fill-slate-900" fontSize="17">Baptism</text>
              <text x="614" y="191" className="fill-slate-500" fontSize="13">The first record</text>

              <circle cx="640" cy="320" r="13" className="fill-slate-400" />
              <text x="640" y="324" textAnchor="middle" className="fill-white" fontSize="10">3</text>
              <text x="672" y="313" className="fill-slate-900" fontSize="17">Enrollment</text>
              <text x="672" y="332" className="fill-amber-800" fontSize="13">School meets parish</text>

              <circle cx="581.4" cy="461.4" r="13" className="fill-amber-800" />
              <text x="581.4" y="465.4" textAnchor="middle" className="fill-white" fontSize="10">4</text>
              <text x="614" y="455" className="fill-slate-900" fontSize="17">Sacramental prep</text>
              <text x="614" y="474" className="fill-slate-500" fontSize="13">Communion, Confirmation</text>

              <circle cx="440" cy="520" r="13" className="fill-slate-400" />
              <text x="440" y="524" textAnchor="middle" className="fill-white" fontSize="10">5</text>
              <text x="440" y="558" textAnchor="middle" className="fill-slate-900" fontSize="17">Student years</text>
              <text x="440" y="577" textAnchor="middle" className="fill-slate-500" fontSize="13">Formation and service</text>

              <circle cx="298.6" cy="461.4" r="13" className="fill-slate-400" />
              <text x="298.6" y="465.4" textAnchor="middle" className="fill-white" fontSize="10">6</text>
              <text x="266" y="455" textAnchor="end" className="fill-slate-900" fontSize="17">Young adult</text>
              <text x="266" y="474" textAnchor="end" className="fill-slate-500" fontSize="13">The record becomes theirs</text>

              <circle cx="240" cy="320" r="13" className="fill-amber-800" />
              <text x="240" y="324" textAnchor="middle" className="fill-white" fontSize="10">7</text>
              <text x="208" y="313" textAnchor="end" className="fill-slate-900" fontSize="17">Marriage</text>
              <text x="208" y="332" textAnchor="end" className="fill-slate-500" fontSize="13">A new household</text>

              <circle cx="298.6" cy="178.6" r="13" className="fill-amber-800" />
              <text x="298.6" y="182.6" textAnchor="middle" className="fill-white" fontSize="10">8</text>
              <text x="266" y="172" textAnchor="end" className="fill-slate-900" fontSize="17">Parish life and legacy</text>
              <text x="266" y="191" textAnchor="end" className="fill-slate-500" fontSize="13">A lifetime given, a good death</text>
            </svg>
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-center text-lg italic text-slate-600">
            The ring does not end at stage eight. A family formed there conceives the next generation
            at stage one — and three generations meet in the same record.
          </p>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-stone-200 bg-stone-200 sm:grid-cols-2 xl:grid-cols-4" data-reveal>
            {[
              ['01', 'Baptism', 'The first record of a Catholic life. Minister, date, godparents, parish — recorded once.', false, ''],
              ['02', 'Inquiry', 'A family asks about the school. The parish knows before enrollment, not months after.', true, ''],
              ['03', 'Enrollment', 'School and parish meet on one household. The single moment no other Catholic platform connects.', true, 'The CFR moment'],
              ['04', 'Sacramental preparation', 'First Communion and Confirmation prep, visible to the classroom and the parish at once.', false, ''],
              ['05', 'Student years', 'Formation, service, and family volunteering — the habit of giving time begins here.', true, 'Time'],
              ['06', 'Graduation & young adult', 'The record does not end at eighth grade. It transfers to the adult it belongs to.', true, 'Talent'],
              ['07', 'Marriage & new household', "A new family, linked to both spouses' histories, registered from the marriage record itself.", false, ''],
              ['08', 'Parish life & legacy', 'Decades of ministry and generosity, and a good death prepared for — funeral wishes and intentions held with the family.', false, 'Treasure'],
            ].map(([n, title, body, wash, tag]) => (
              <div key={String(n)} className={`p-5 ${wash ? 'bg-stone-100' : 'bg-white'}`}>
                <span className="block text-base font-semibold tracking-wide text-amber-800">{n}</span>
                <h4 className="mt-2 font-serif text-xl text-slate-900">{title}</h4>
                <p className="mt-2 text-lg text-slate-600">{body}</p>
                {tag ? (
                  <span className={`mt-3 inline-block rounded px-2 py-1 text-sm font-semibold uppercase tracking-wide ${tag === 'The CFR moment' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-900'}`}>
                    {tag}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-6 text-base text-slate-600">
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-3 w-3 rounded-full bg-amber-800" aria-hidden="true" />
              Sacramental milestone
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="inline-block h-3 w-3 rounded-full bg-slate-400" aria-hidden="true" />
              Institutional touchpoint
            </span>
          </div>
          <div className={`${narrow} mt-14 border-t border-stone-200 pt-10 text-center`}>
            <p className={eyebrow}>And then it begins again</p>
            <h3 className={`${heading3} mt-3`}>When that child's child is baptized, three generations meet in one record.</h3>
            <p className={`${lede} mx-auto`}>
              This is the thing no competitor can build and no diocese has ever had. Not a database
              of the living — a continuous account of a Catholic family in your diocese across
              generations. The diocese stops forgetting families.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionAlt} id="today">
        <div className={wrap}>
          <SectionHead
            center
            kicker="Said plainly, before anything else"
            title="What exists today, and what we are building with you."
          >
            A founding partnership is worth nothing if you cannot tell which parts are real. Here is
            the honest division. We would rather you hold us to it than discover it later.
          </SectionHead>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <StageCard
              kicker="Available today"
              title="In service now"
              intro="Running in Catholic schools and parishes across the country, and has been for years."
              items={[
                'School information and administration',
                'Parish records and administration',
                'Tuition, giving, and family payments',
                'Communication and emergency alerts',
              ]}
            />
            <StageCard
              kicker="Ready for pilot"
              title="The shared record"
              intro="Ready to prove in one parish and one school during the founding year."
              items={[
                'One household shared by parish and school',
                'Sacramental history on the family record',
                'Permission scoping between institutions',
                'A single communication and alert list',
              ]}
            />
            <StageCard
              kicker="Built with the cohort"
              title="Shaped by founding dioceses"
              intro="Specified with founding partners and delivered before go-live. Commitments, not things you can see today."
              items={[
                'Diocesan roll-up and mission reporting',
                'Records that follow a family between parishes',
                'Ministry, volunteer, and clearance management',
                'Family self-service and record access',
              ]}
            />
          </div>
          <p className={`${narrow} mt-6 text-center text-lg text-slate-600`}>
            Everything in the third column is why a founding cohort exists. You are not buying it as
            it stands. You are deciding what it becomes.
          </p>
        </div>
      </section>

      <section className={section} id="replace">
        <div className={wrap}>
          <SectionHead
            kicker="Boxes, and the space between them"
            title="Every system you run is a box. Nothing owns the space between the boxes."
          >
            Your systems are not badly built. The tuition system processes tuition correctly. The
            census system keeps a census. Each one does its job inside its own walls — and not one of
            them was ever responsible for the space in between, because no single-purpose vendor can
            be. That space is where your families go missing, and it has never had an owner.
          </SectionHead>
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg border border-dashed border-stone-300 bg-white p-5">
              <p className={`${eyebrow} mb-4 text-slate-500`}>What each office runs — many, and rightly so</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {['Enrollment', 'Sacraments', 'Giving', 'Formation', 'Volunteers', 'Messaging'].map((box) => (
                  <span key={box} className="rounded-md border border-stone-200 bg-stone-100 px-2 py-3 text-center text-base font-medium text-slate-800">
                    {box}
                  </span>
                ))}
              </div>
            </div>
            <div className="mx-auto my-0 h-8 w-px bg-stone-300" aria-hidden="true" />
            <div className="rounded-lg bg-slate-900 px-6 py-8 text-center text-white">
              <p className="font-serif text-2xl sm:text-3xl">One Catholic Family Record</p>
              <p className="mt-2 text-lg text-stone-200">The record beneath every function. Functions can be many. The record cannot.</p>
            </div>
          </div>
          <p className={`${narrow} mt-6 text-center text-lg text-slate-600`}>
            This is the whole architecture. Tools are plural by nature — offices need different ones
            and change them over time. A family is singular. The moment you have two records for one
            family, every problem on this page follows, and no amount of good software inside any one
            box will fix it.
          </p>
          <Callout kicker="Why this keeps happening" title="The system changes every few years. The history does not survive the change.">
            <p>Have you ever wondered why parishes, schools, and dioceses keep replacing their management systems every few years — and what became of the records held in the last one? The answer is usually the same. Data that would not come cleanly out of the old system, and whatever did come out was never fully loaded into the new one. Years of history stranded in a secular platform the diocese no longer pays for, and a sacramental record that now begins on the day the current system went live.</p>
            <p>That is not poor judgment, and it is not restlessness. It is what happens when a Catholic institution is asked to run on something built for somebody else. A school is handed a system designed for a public district, where sacramental milestones become custom fields and the parish connection becomes a manual report. A parish is handed one designed for congregational churches, where there is no register to notate, no OCIA, no territory, and a parishioner is modeled as a donor. The fit is wrong from the first week, so in a few years someone reasonably tries a different one — and the diocese pays for the change in the only currency it cannot replace.</p>
            <p>The churn is not the problem. The churn is the symptom of asking a tool to serve as a record. Tools should change; offices need different ones and their needs move. A record should not, because it is the one thing here that took generations to accumulate and cannot be bought back.</p>
            <p>The churn ends when the tools are built for the Church to begin with — when they assume a sacramental register, a parish territory, a catechumen, a family formed across a school and a parish at once. Software that shares the Church's purpose does not need replacing every few years, because it was never the wrong shape. And only then does the record become what it was always meant to be: a foundation steady enough to build on, so a diocese can stop tending its systems and give its attention to catechesis, evangelization, and the growth of the Church.</p>
          </Callout>
        </div>
      </section>

      <section className={sectionAlt}>
        <div className={wrap}>
          <SectionHead
            center
            kicker="What fragmentation costs before anyone logs in"
            title="Count what your diocese manages, not what it uses."
          >
            Software is the smallest line in this. The real cost is everything that has to happen
            around it, every year, in every office, forever.
          </SectionHead>
          <div className={`${narrow} rounded-r-lg border border-stone-200 border-l-4 border-l-amber-800 bg-white p-6 sm:p-8`} data-reveal>
            <p className={`${eyebrow} mb-3`}>Illustrative · a mid-sized diocese today</p>
            <StatRow label="Vendor contracts to negotiate and renew" value="11" />
            <StatRow label="Separate renewal dates to track" value="9" />
            <StatRow label="Support lines to call when something breaks" value="6" />
            <StatRow label="Security and privacy reviews each year" value="6" />
            <StatRow label="Data exports and reconciliations" value="4" />
            <StatRow label="Systems that hold your families" value="1" last />
            <p className="mt-5 font-serif text-2xl leading-snug text-slate-900">
              License fees are the smallest line on this list. Every other row is somebody's week.
            </p>
          </div>
        </div>
      </section>

      <section className={sectionWash}>
        <div className={wrap}>
          <SectionHead kicker="The founding difference" title="You are not buying a catalog. You are writing one.">
            No national vendor will build something for one diocese. Their roadmap is set by a
            market, and your diocese is one voice among thousands in it. Ours is set by a founding
            cohort small enough that every member is in the room — and there is time to do it
            properly before you go live.
          </SectionHead>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Autumn 2026 – spring 2027', 'The cohort specifies', 'Founding dioceses meet as a group and decide what the record must do for a diocese — jointly, so the roadmap serves all of you rather than fragmenting across each of you.'],
              ['Spring 2027 – summer 2027', 'We build to it', 'What the cohort prioritizes gets built or modified, and each diocese is configured to its own governance — parish-governed schools and diocesan schools are not the same thing and are not treated as such.'],
              ['2027–28 fiscal year', 'You go live on it', 'Not on a product built for someone else and adapted to you. On one shaped around how your diocese actually works, with a full year of specification behind it.'],
            ].map(([when, title, body]) => (
              <div key={title} className={`${card} border-t-4 border-t-amber-800`}>
                <p className={eyebrow}>{when}</p>
                <h4 className={`${heading3} mt-2`}>{title}</h4>
                <p className="mt-2 text-lg text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <div className={`${narrow} mt-11 border-t border-stone-200 pt-8`}>
            <h3 className={`${heading3} mb-4`}>How a first year actually runs</h3>
            <p className="mb-3 text-xl leading-relaxed text-slate-600"><strong className="text-slate-900">One parish, one school.</strong> A single pair moves onto the record while everything else in the diocese keeps running exactly as it does today. Nobody bets a diocese on a summer.</p>
            <p className="mb-3 text-xl leading-relaxed text-slate-600"><strong className="text-slate-900">Prove it in one school year.</strong> Two offices, one record, a full academic year. If it does not visibly give those two offices their week back, it should not be extended, and we will say so first.</p>
            <p className="text-xl leading-relaxed text-slate-600"><strong className="text-slate-900">Expand at your pace.</strong> Each additional parish and school comes on when its pastor and principal are ready and its current agreements allow, with a named specialist for every move.</p>
          </div>
        </div>
      </section>

      <section className={section}>
        <div className={`${wrap} text-center`}>
          <p className={eyebrow}>The decision in front of you</p>
          <h2 className={`${heading2} mx-auto max-w-4xl`}>A platform is a mission decision, not an IT one.</h2>
          <p className={`${lede} mx-auto`}>
            Procurement asks which box is best. Asked carefully, category by category, year after
            year, that question is precisely how a diocese ends up with eleven of them — each one a
            sound choice, and all of them together the reason nobody can see a family whole.
          </p>
          <p className={`${lede} mx-auto mt-4`}>
            The better question is what becomes possible once a family stops being scattered. A
            school that is genuinely the parish's front door. A diocese that no longer loses the
            family who moved four miles. Offices that get their weeks back for catechesis and
            evangelization — the work that actually grows the Church, and the work that fragmentation
            has been quietly taxing for twenty years.
          </p>
          <p className="mx-auto mt-8 max-w-3xl border-t border-stone-200 pt-7 font-serif text-2xl leading-snug text-slate-900 sm:text-3xl">
            The Catholic Family Record is not a better box. It is the thing that was always missing
            between them.
          </p>
        </div>
      </section>

      <section className={section} id="founding">
        <div className={wrap}>
          <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-10" data-reveal>
            <p className={eyebrow}>By invitation · A small founding cohort</p>
            <h2 className={heading2}>Become a Founding CFR Diocese.</h2>
            <p className={lede}>
              We are opening the Catholic Family Record to a small group of founding dioceses — the
              first to bring their schools and parishes onto one record, and the ones who will decide
              what it becomes. Founding partners are not early customers. They are co-authors.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ['50% off for two years', 'Founding pricing across parishes and PreK–8 schools, held for two full years from your start date.', true],
                ['Dedicated onboarding', 'A named specialist for your migration, working directly with each parish and school office.', false],
                ["Product influence", "Your diocese's needs shape the roadmap. Founding partners meet with us on it directly.", false],
                ['Priority support', 'A direct line to our team, not a queue, for the length of the founding term.', false],
                ['Early access', 'Ministry modules and diocesan reporting reach founding dioceses first.', false],
                ['A pilot, not a leap', 'Begin with one parish and one school. Expand only when it has proven itself.', false],
              ].map(([title, body, lead]) => (
                <div key={String(title)} className={`rounded-lg border p-5 ${lead ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-stone-50'}`}>
                  <h4 className={`text-lg font-bold ${lead ? 'text-amber-900' : 'text-slate-900'}`}>{title}</h4>
                  <p className="mt-1 text-lg text-slate-600">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className={btn} href="#talk">Request a Discovery Session</a>
              <a className={btnGhost} href="mailto:CatholicInnovation@OptionC.com">Email us directly</a>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionAlt}>
        <div className={wrap}>
          <SectionHead center kicker="Questions we are asked first" title="The hard ones, answered plainly." />
          <div className={`${narrow} border-t border-stone-200`}>
            <Faq q="Who owns the data?">
              <p>The diocese and its institutions own their institutional records. The family owns its personal record. We do not sell your data and we do not broker it to anyone. If you leave, you leave with a complete export in an open format — a commitment that belongs in your contract, not only on a website.</p>
            </Faq>
            <Faq q="Our parishes share a school and will not share data with each other. Can this work?">
              <p>Yes, and it is the case we designed for. Identity and sacramental information is shared; giving history, tuition assistance, and pastoral notes never cross a parish boundary. Scope is enforced in the data layer rather than hidden in the interface, and every access is logged so a pastor can audit exactly who opened his families' records.</p>
            </Faq>
            <Faq q="Does this hand the chancery control over my parish?">
              <p>No. The record changes what each office can see, not who decides anything. A parish school remains the pastor's to govern, and diocesan offices gain visibility into totals and trends rather than authority over decisions. Nothing in the platform creates a reporting line that your diocesan policy does not already establish.</p>
              <p>We built it on subsidiarity deliberately, because a system that quietly centralizes authority would be resisted by exactly the pastors it needs, and rightly so. Permissions are configured to match your diocese's actual governance — not the other way around.</p>
            </Faq>
            <Faq q="Does this replace our sacramental registers?">
              <p>No. The canonical register remains the parish's, kept as canon law requires. The Catholic Family Record is the index and the notation flow around it — so a record can be found, verified, and shared without anyone driving to a parish basement, and so it survives a merger or a closure.</p>
            </Faq>
            <Faq q="Do you track whether families attend Mass?">
              <p>No. We considered it and decided against it. A system that quietly monitors your parishioners' religious practice would cost more trust than any report it produced could return. The Catholic Family Record holds records families give and sacraments the Church confers — not surveillance of the faithful.</p>
              <p>The distinction runs deeper than privacy. A secular platform can only measure engagement, because measuring is all it was ever built to do — it has no stake in what happens next. Ours is built for the work the Church is actually doing: connecting a school family to OCIA, tying formation to the classroom, making sure a child preparing for Confirmation is known by the parish and the school at once. We are not here to score your parishioners. We are here to help you catechize and evangelize them.</p>
            </Faq>
            <Faq q="How long does implementation take, honestly?">
              <p>Longer than a vendor replacement, because that is not what this is. Changing how a diocese holds information about its people — schools, parishes, volunteers, ministries, safe environment, giving — is measured in years, and any vendor who tells you otherwise is selling you something.</p>
              <p>That does not mean years of waiting. A pilot parish and school — or a starting group of schools or parishes — runs across one school year, and the connect-first approach gives you a unified view while migration continues underneath it.</p>
            </Faq>
            <Faq q="How much will this cost?">
              <p>The Catholic Family Record is priced on the number of Catholics in the diocese, not the number of families already registered in a parish or enrolled in a school.</p>
              <p>That is deliberate. Vendors price on registered families because that is who their systems serve — which quietly accepts that the Catholics who have drifted are not the diocese's concern. A bishop is responsible for every Catholic in his territory, not only the ones already in a database. The pricing should reflect the work, not the subset that is easy to count.</p>
              <p>Part of the discovery session is establishing what the diocese currently spends across its separate school, parish, giving, communication, and volunteer systems — including the staff hours those systems consume between them. Most dioceses have never seen that figure in one place. It is worth knowing regardless of what you decide about the Catholic Family Record.</p>
            </Faq>
            <Faq q="What staff do we need to roll this out?">
              <p>Less than most dioceses expect. The system is hosted — no servers, nothing to install, no infrastructure for IT to maintain. Schools and parishes import their own data with guided tools, and training is online and self-paced, so the technical lift on your staff is genuinely light.</p>
              <p>What the project needs is not technical. It needs a project sponsor at the chancery with authority to settle questions that cross departments, a pastor and principal at the pilot who are willing participants rather than assigned ones, and a few hours from each department that will use the record.</p>
              <p>The software is the easy part. Agreeing how a diocese identifies a family, which record is authoritative, and who may see what — that is the work, and it is why this takes years rather than months.</p>
            </Faq>
            <Faq q="What does a family experience?">
              <p>Every family has its own login. They see their own record — their children's enrollment, their sacramental history, their giving — and they keep it current themselves. A new phone number, a change of address, a child away at college, a willingness to serve on a Saturday: all of it updates at the source rather than traveling through a parish secretary who is already underwater.</p>
              <p>What a family may see and change is governed by the same permissions the diocese sets everywhere else. Families maintain their own contact and household information; sacramental records remain the Church's to enter and verify.</p>
              <p>This matters more than it sounds. A parent who manages her mortgage, her pediatrician, and her child's lunch account from her phone will not call a parish office between nine and three. She is not disengaged — she has been handed the one institution in her life that still requires a phone call, and she drifts without ever deciding to. Friction is never neutral. A family that can see its own record, print its own statements, and step forward to serve without asking permission first is a family that stays.</p>
            </Faq>
            <Faq q="How do other diocesan ministries and departments access the record — and how are they charged?">
              <p>Through the same CatholicLogin, with permissions the diocese defines by role. Nobody sees everything. Evangelization sees the school families already connected to the Church and today invisible to it. Communications sees current contact information without rebuilding a list. Safe environment sees clearances and expirations across every parish and school at once. Each office gets the slice its work requires, and every access is logged.</p>
              <p>Some records cannot be shared and are not. Tribunal files, safe environment case files, and Catholic Charities client information stay with the offices that hold them. The record connects identity across the diocese; it does not pool confidential files.</p>
              <p>There is no separate charge by department or by seat. Pricing is based on the Catholic population of the diocese and every diocesan office is included — charging per office would recreate the fragmentation the record exists to end.</p>
            </Faq>
            <Faq q="How many founding dioceses are you accepting?">
              <p>Four, though the number may shift with the size of the dioceses that join. Four large archdioceses is a different commitment than four smaller ones, and we would rather size the group to what we can support well.</p>
              <p>The system is built. OptionC has served Catholic schools for twenty years, the Parish Management System is complete, and the record connecting them is what founding partners are implementing. What the cohort shapes is how it extends into diocesan work — which offices, which reports, which ministries come next. The limit exists so each partner has direct access to the team doing that work.</p>
            </Faq>
            <Faq q="Do founding dioceses work together, or is each implementation separate?">
              <p>Both. Each diocese has its own timeline, its own configuration, and a named specialist through implementation — nothing about your rollout depends on another diocese's pace.</p>
              <p>Alongside that, the founding cohort meets by video every few weeks during the first year: what worked, what didn't, what a diocese wishes it had known before it started. There is no substitute for hearing it from another chancery rather than from us. We would expect one in-person gathering as the first year closes, though that is the cohort's decision, not ours.</p>
              <p>Sessions are about implementation and practice, not diocesan data. Nothing about your families, finances, or internal decisions is visible to another diocese at any point.</p>
            </Faq>
            <Faq q="Can a school participate if its parish is not ready?">
              <p>Yes. Schools and parishes can each start alone. The record is built so the connection can be made later, without re-entering anything, whenever the other office is ready.</p>
            </Faq>
            <Faq q="Is our data secure?">
              <p>The record holds sacramental history and identity documents, which is identity-theft-grade information, and it is treated that way: encrypted in transit and at rest, scope enforced at the data layer, every access audit-logged, and sharing that is explicit, time-limited, and revocable by the family. Our full security documentation is provided during a Discovery Session.</p>
            </Faq>
          </div>
        </div>
      </section>

      <section className={section} id="talk">
        <div className={wrap}>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className={eyebrow}>The next step</p>
              <h2 className={heading2}>See your diocese whole.</h2>
              <p className={`${lede} mb-6`}>
                A Discovery Session puts your chancery, your superintendent, and your parish
                leadership in front of the same family on one record — across every stage, every
                institution, and every office that currently keeps its own list. Ninety minutes,
                built around your diocese, not a demo reel.
              </p>
              <p className="text-lg leading-8 text-slate-600">
                CatholicInnovation@OptionC.com
                <br />
                855.822.8418
              </p>
            </div>
            <form id="dsform" noValidate onSubmit={onSubmit} onFocus={onFormFocus}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={fieldLabel} htmlFor="n">Name</label>
                  <input id="n" name="name" type="text" autoComplete="name" placeholder="e.g. Margaret Chen" required className={fieldInput} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="e">Email</label>
                  <input id="e" name="email" type="email" autoComplete="email" placeholder="e.g. mchen@archdiocese.org" required className={fieldInput} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="o">Diocese, parish, or school</label>
                  <input id="o" name="organization" type="text" autoComplete="organization" placeholder="e.g. Archdiocese of St. Louis" required className={fieldInput} />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="r">Your role</label>
                  <select id="r" name="role" required defaultValue="" className={fieldInput}>
                    <option value="" disabled>Select your role — e.g. Pastor</option>
                    <option>Bishop's office</option>
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
              <div className="mt-4">
                <label className={fieldLabel} htmlFor="m">What would you want a session to answer?</label>
                <textarea id="m" name="message" placeholder="e.g. How would one shared record work across our parish and school offices?" className={`${fieldInput} min-h-28`} />
              </div>
              <button className={`${btn} mt-4 w-full disabled:cursor-not-allowed disabled:opacity-70`} type="submit" disabled={btnDisabled}>
                {btnLabel}
              </button>
              <p id="dsnote" className={`mt-3 min-h-6 text-lg ${note.ok ? 'text-green-800' : 'text-red-800'}`} role="status">
                {note.text}
              </p>
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-stone-100 py-10 text-center text-lg text-slate-600">
        <div className={wrap}>
          <p className="mb-2 font-serif text-xl text-slate-900">One family. One record. One faith.</p>
          <p>Serving Catholic schools and parishes for over 20 years · optionc.com</p>
        </div>
      </footer>
    </div>
  )
}
