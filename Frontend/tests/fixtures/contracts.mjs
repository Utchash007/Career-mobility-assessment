// Entirely fictional in-memory inputs. No account, session or persisted profile.
export function profileFixture(overrides = {}) {
  return {
    user_id: "user_fictional_contract_fixture",
    full_name: "Fictional Candidate",
    birthday: null,
    education: { level: null, field_of_study: null, is_enrolled: null },
    experience_years: null,
    skills: [],
    languages: [],
    preferred_locations: [],
    career_interests: [],
    work_authorisation: { status: "unknown", countries: [] },
    created_at: "2026-11-19T10:00:00Z",
    updated_at: "2026-11-19T10:00:00Z",
    ...overrides,
  };
}

export function opportunityFixture(overrides = {}) {
  return {
    id: 1,
    slug: "fictional-contract-role",
    title: "Fictional Contract Role",
    organisation: "Fictional Organisation",
    country: "DE",
    city: "Berlin",
    type: "job",
    experience_level: "entry",
    min_years: 0,
    max_years: null,
    required_skills: [],
    preferred_skills: [],
    education_requirements: { required: null, preferred: null },
    languages: [],
    eligibility_requirements: [],
    work_mode: "onsite",
    is_shortlisted: false,
    ...overrides,
  };
}

export function matchFixture(overrides = {}) {
  return {
    opportunity_id: 1,
    slug: "fictional-contract-role",
    title: "Fictional Contract Role",
    overall_score: null,
    label: "insufficient_data",
    criteria: ["skills", "language", "experience", "education", "location"].map(
      (key) => ({
        key,
        weight: 0.2,
        score: null,
        status: "unknown",
        reason: "Fictional missing-data contract example.",
        evidence: {},
      }),
    ),
    flags: [],
    criteria_evaluated: 0,
    criteria_total: 5,
    matcher_version: "fictional-contract-fixture",
    ...overrides,
  };
}

export function emptyPageFixture(overrides = {}) {
  return {
    items: [],
    pagination: {
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
      has_next: false,
      has_previous: false,
      ...overrides,
    },
  };
}
