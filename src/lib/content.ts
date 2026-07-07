export const site = {
  name: "AIEstimate",
  domain: "www.aiestimate.org",
  url: "https://www.aiestimate.org",
  tagline: "AI-powered construction & renovation estimates",
  description:
    "AIEstimate turns blueprints, photos, and scope notes into accurate, line-item construction and renovation estimates in minutes — so contractors and remodelers can bid faster and win more work.",
};

export const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Results", href: "#results" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const heroStats = [
  { value: "40%", label: "faster bid turnaround" },
  { value: "98%", label: "estimate-to-actual accuracy" },
  { value: "3.2x", label: "more bids sent per week" },
];

export const features = [
  {
    title: "Plans & photos, understood instantly",
    description:
      "Upload blueprints, jobsite photos, or a plain-language scope of work. AIEstimate detects square footage, materials, and scope automatically — no manual takeoffs required.",
    icon: "scan",
  },
  {
    title: "Line-item pricing you can defend",
    description:
      "Every estimate breaks down labor, materials, and overhead, benchmarked against regional cost data refreshed weekly — so your numbers hold up in front of a client.",
    icon: "layers",
  },
  {
    title: "Catches what bid-loss is made of",
    description:
      "The model flags underpriced line items, missing scope, and common margin leaks before you hit send, drawing on patterns from thousands of past estimates.",
    icon: "flag",
  },
  {
    title: "Client-ready proposals in seconds",
    description:
      "Every estimate becomes a branded, e-signable proposal automatically — with your logo, terms, and payment schedule already in place.",
    icon: "doc",
  },
  {
    title: "Learns your jobs, not just averages",
    description:
      "Connect past bids and actual job costs, and AIEstimate calibrates to how your crews really perform — not a generic national average.",
    icon: "brain",
  },
  {
    title: "Fits the stack you already run",
    description:
      "Sync estimates straight into QuickBooks, Procore, and your CRM, so a won bid turns into a scheduled job without re-keying a single line.",
    icon: "plug",
  },
];

export const steps = [
  {
    step: "01",
    title: "Upload the job",
    description:
      "Drop in blueprints, jobsite photos, or just describe the scope in your own words.",
  },
  {
    step: "02",
    title: "AI runs the takeoff",
    description:
      "AIEstimate measures scope, matches materials, and prices labor against current regional data.",
  },
  {
    step: "03",
    title: "Review & adjust",
    description:
      "Fine-tune any line item, swap in your own price book, and see margins update live.",
  },
  {
    step: "04",
    title: "Send & win the job",
    description:
      "Deliver a branded, e-signable proposal in one click and track it through to a signed job.",
  },
];

// Illustrative examples of the outcomes AIEstimate is designed to produce.
// Replace with verified customer quotes and names before using in live marketing.
export const testimonials = [
  {
    quote:
      "We used to spend a full evening building a single renovation estimate. Now the first draft is ready before the coffee's done, and we just tune the numbers.",
    role: "General contractor, residential remodels",
  },
  {
    quote:
      "The line-item flags caught a framing quantity we'd underbid twice before. That one catch paid for the year.",
    role: "Estimator, commercial buildout firm",
  },
  {
    quote:
      "Clients take us more seriously when the proposal looks this sharp and arrives same-day instead of next week.",
    role: "Owner, kitchen & bath remodeling company",
  },
];

export const pricing = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    description: "For solo contractors and small crews getting estimates out faster.",
    features: [
      "15 AI estimates / month",
      "Photo & plan takeoffs",
      "Branded client proposals",
      "Regional cost data",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    description: "For growing teams that need unlimited estimates and integrations.",
    features: [
      "Unlimited AI estimates",
      "Custom price books",
      "QuickBooks & Procore sync",
      "Team seats & permissions",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "Custom",
    period: "",
    description: "For multi-crew operations and franchises with dedicated needs.",
    features: [
      "Everything in Pro",
      "API & white-label access",
      "Dedicated onboarding",
      "Custom data integrations",
      "SLA & account manager",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

export const faqs = [
  {
    question: "How accurate are AI-generated estimates?",
    answer:
      "AIEstimate benchmarks every line item against continuously updated regional labor and material pricing, and calibrates further as you connect your own historical bids and job actuals. Estimates are a strong first draft you review and adjust — you always stay in control of what you send.",
  },
  {
    question: "Can I use my own pricing or cost book?",
    answer:
      "Yes. Pro and Business plans let you import your own price book, and AIEstimate will prioritize your numbers over regional averages while still flagging anything that looks out of line.",
  },
  {
    question: "Does it handle renovations as well as new builds?",
    answer:
      "AIEstimate is built for renovation, remodeling, and buildout work specifically — including partial-scope jobs like kitchens, baths, additions, and tenant improvements — as well as ground-up construction.",
  },
  {
    question: "Do I need blueprints, or can I just describe the job?",
    answer:
      "Either works. Upload plans or photos for the most detailed takeoff, or describe the scope in plain language and let AIEstimate ask clarifying questions to fill in the gaps.",
  },
  {
    question: "Is my project data secure?",
    answer:
      "Your plans, pricing, and client data are encrypted in transit and at rest, and are never used to train models for other companies. You can export or delete your data at any time.",
  },
];
