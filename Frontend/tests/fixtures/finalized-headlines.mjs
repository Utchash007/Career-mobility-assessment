// Headlines captured from the backend's pure matcher + fictional seed/sample,
// matcher 1.0.0. Not live accounts/persistence or invented design target scores.
export const finalizedHeadlines = [
  {
    title: "Programme Assistant, International NGO",
    overall_score: 95.2,
    label: "strong",
    criteria_evaluated: 5,
    flags: [
      {
        code: "work_authorisation",
        severity: "verify",
        message:
          "Work authorisation for DE was not provided for this country. Requires verification.",
      },
    ],
  },
  {
    title: "German-speaking Client Associate",
    overall_score: 68.0,
    label: "not_recommended",
    criteria_evaluated: 5,
    flags: [
      {
        code: "work_authorisation",
        severity: "verify",
        message:
          "Work authorisation for DE was not provided for this country. Requires verification.",
      },
      {
        code: "language",
        severity: "critical",
        message:
          "Declared languages do not meet required de at professional level.",
      },
    ],
  },
  {
    title: "Programme Support Officer, UN-affiliated Body",
    overall_score: 69.0,
    label: "partial",
    criteria_evaluated: 5,
    flags: [
      {
        code: "work_authorisation",
        severity: "verify",
        message:
          "Work authorisation for CH was not provided for this country. Requires verification.",
      },
    ],
  },
  {
    title: "Senior Operations Manager, Manufacturing",
    overall_score: 56.0,
    label: "partial",
    criteria_evaluated: 5,
    flags: [
      {
        code: "work_authorisation",
        severity: "verify",
        message:
          "Work authorisation for DE was not provided for this country. Requires verification.",
      },
    ],
  },
];
