import "dotenv/config";
import { db } from "./index.js";
import { ensureAdminUser } from "../services/authService.js";
import { createId } from "../utils/id.js";
import { env } from "../utils/env.js";

ensureAdminUser();

const existing = (
  db.prepare("SELECT COUNT(*) as c FROM leads").get() as { c: number }
).c;

if (existing > 0) {
  console.log(`Seed skipped — ${existing} leads already present.`);
  process.exit(0);
}

const sampleLeads = [
  {
    name: "Margaret Chen",
    email: "mchen@archdiocese.example",
    organization: "Archdiocese of St. Louis",
    role: "Superintendent of schools",
    message: "We want to see how one record would work across our parish schools.",
    status: "qualified",
    daysAgo: 2,
  },
  {
    name: "Fr. Thomas Brennan",
    email: "pastor@stmarys.example",
    organization: "St. Mary's Parish",
    role: "Pastor",
    message: "Our school and parish offices re-key the same families every fall.",
    status: "contacted",
    daysAgo: 4,
  },
  {
    name: "Elena Vargas",
    email: "evargas@holycrossschool.example",
    organization: "Holy Cross School",
    role: "Principal",
    message: "Interested in a Discovery Session for our business manager and pastor.",
    status: "new",
    daysAgo: 0,
  },
  {
    name: "James Okafor",
    email: "jokafor@diocese.example",
    organization: "Diocese of Arlington",
    role: "Chief financial officer",
    message: "Need clarity on founding pricing and multi-year vendor consolidation.",
    status: "scheduled",
    daysAgo: 6,
  },
  {
    name: "Sister Anne Marie",
    email: "anne.marie@chancery.example",
    organization: "Diocese of Buffalo",
    role: "Chancery director",
    message: "Safe environment tracking is still in spreadsheets diocese-wide.",
    status: "new",
    daysAgo: 1,
  },
  {
    name: "Robert Hale",
    email: "rhale@bishopsoffice.example",
    organization: "Diocese of Fort Worth",
    role: "Bishop's office",
    message: "Please walk us through the founding cohort timeline for 2026–27.",
    status: "qualified",
    daysAgo: 9,
  },
  {
    name: "Claire Nguyen",
    email: "cnguyen@sacredheart.example",
    organization: "Sacred Heart Parish & School",
    role: "Parish business manager",
    message: "We share a school with two other parishes and cannot share giving data.",
    status: "contacted",
    daysAgo: 3,
  },
  {
    name: "Daniel Ruiz",
    email: "druiz@vicar.example",
    organization: "Diocese of Sacramento",
    role: "Vicar general",
    message: "Want a session focused on moves within the diocese and attrition reporting.",
    status: "new",
    daysAgo: 5,
  },
  {
    name: "Patricia Doyle",
    email: "pdoyle@stjoseph.example",
    organization: "St. Joseph School",
    role: "Principal",
    message: "",
    status: "closed",
    daysAgo: 18,
  },
  {
    name: "Michael Santos",
    email: "msantos@option-partner.example",
    organization: "Diocese of Phoenix",
    role: "Other",
    message: "Exploring on behalf of our innovation committee.",
    status: "archived",
    daysAgo: 22,
  },
];

const insert = db.prepare(
  `INSERT INTO leads (id, name, email, organization, role, message, status, source, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, 'landing', datetime('now', ?), datetime('now', ?))`,
);

const insertEvent = db.prepare(
  `INSERT INTO page_events (id, event_type, path, meta, created_at)
   VALUES (?, ?, ?, ?, datetime('now', ?))`,
);

const tx = db.transaction(() => {
  for (const lead of sampleLeads) {
    const offset = `-${lead.daysAgo} days`;
    insert.run(
      createId(),
      lead.name,
      lead.email,
      lead.organization,
      lead.role,
      lead.message || null,
      lead.status,
      offset,
      offset,
    );
  }

  for (let i = 0; i < 140; i++) {
    const days = Math.floor(Math.random() * 30);
    insertEvent.run(
      createId(),
      "page_view",
      "/",
      null,
      `-${days} days`,
    );
  }

  for (let i = 0; i < 35; i++) {
    const days = Math.floor(Math.random() * 30);
    insertEvent.run(
      createId(),
      "form_start",
      "/#talk",
      null,
      `-${days} days`,
    );
  }
});

tx();

console.log("Seed complete.");
console.log("Admin email (from env):", env.adminEmail);
console.log("Admin password is set from ADMIN_PASSWORD in server/.env (not printed).");
