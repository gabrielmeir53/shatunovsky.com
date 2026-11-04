/**
 * data/course-chart.js — which courses the law school expects to offer each semester at University
 * Park, from "Course Chart (FA25-SP27)" (last updated 9/25/2026). Used only by the remaining-semester
 * planner and the course browser's "Offered" column.
 *
 *   prefix     — subject code printed on the chart (LWELA, LWEXP, …)
 *   name       — course name as printed (matched to the catalog by title via match.js)
 *   temporary  — chart marks the course with * ("not a permanent part of the curriculum")
 *   terms      — FA25 / SP26 / FA26 / SP27 columns that are filled in
 *
 * Caveats from the chart itself: offerings are ANTICIPATED and subject to change, and adjunct-taught
 * and cross-location courses are not listed.
 */
export default {
 "_readme": "Course Chart FA25-SP27, Penn State Dickinson Law - University Park (last updated 9/25/2026), as copied into the Concentration Planning Kit. 'temporary' = marked * (not a permanent part of the curriculum). Adjunct-taught and cross-location courses are NOT on the chart. Terms are anticipated and subject to change.",
 "source": "Course Chart (FA25-SP27).pdf, last updated 9/25/2026",
 "rows": [
  {
   "prefix": "LWCLI",
   "name": "Advanced Center for Immigrants' Rights",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Advanced Family Law Clinic",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Anuncia Donecia Songsong Manglona Lab for Gender and Economic Equity",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Arts, Sports and Entertainment Law Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Center for Immigrants' Rights",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Civil Rights Appellate Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Criminal Appellate & Post-Conviction Services Clinic",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Entrepreneur Assistance Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Family Law Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Intellectual Property Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Rural Economic Development Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWCLI",
   "name": "Veterans and Servicemembers Legal Clinic",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Administrative Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Advanced Criminal Procedure",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Advanced Evidence",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Advanced Torts",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Agricultural Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "American Indian Law",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Animal Law",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Antitrust",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Asylum and Refugee Law",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Aviation Law",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Banking Regulation",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Bankruptcy",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Basic Federal Income Tax",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Biotechnology Law",
   "temporary": true,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Business Entities I: Unincorporated Business Entities",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Business Entities II: Corporations",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Business Planning for Mergers & Acquisitions",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Comparative Constitutional Law",
   "temporary": true,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Comparative Energy Law and Justice",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Comparative Law",
   "temporary": true,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Conflict of Laws",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Con Law II",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Copyrights",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Corporate and Partnership Tax",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Corporate Valuation in M&A",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Criminal Procedure",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Data Center Law and Policy",
   "temporary": true,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Disabilities Law",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Election Law",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Employment Discrimination",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Energy Law and Policy",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Environmental Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Estate & Gift Tax",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Evidence",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Family Law",
   "temporary": false,
   "terms": [
    "FA25",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Federal Courts",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Federal Securities Reg",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "First Amendment",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Food and Drug Regulation",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Fundamental Skills for the Bar Examination",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Gender and Sexuality Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Global Health Law",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Health Law",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Health Law & Policy",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Human Rights in China",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Immigration Law",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "International Bankruptcy",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "International Commercial Arbitration (Experiential effective Fall 2026)",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "International Criminal Law",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "International Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Internet Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Intro to Private Wealth (1 credit)",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Introduction to Intellectual Property",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Juvenile Law",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Labor Law",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Law of Armed Conflict",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Land Use Regulation",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Licensing of IP",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Military Law",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Multinational Corp",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "National Security Law",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Natural Resources Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Nonprofit Organizations Law",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Oil and Gas Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Patent Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Payment Systems and Financial Transactions",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Poverty Law",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Public Health Law",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Remedies",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Sales",
   "temporary": false,
   "terms": [
    "FA25",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Secured Transactions",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26"
   ]
  },
  {
   "prefix": "LWELB",
   "name": "Spanish for Lawyers",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Sports Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Statutory Interpretation",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Strategic Legal Analysis: Exams, Reasoning, and Performance",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "The Constitutional Law of Religion",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Trademarks",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Veterans Benefits Law",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Water Law and Policy",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "White-Collar Crime",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWELA",
   "name": "Wills, Trusts and Estates",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Advanced Legal Writing",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Advanced Legal Research: Application and Strategies",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Advanced Legal Research: Criminal Law",
   "temporary": true,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Advanced Legal Research: Legal Tech & Ethics",
   "temporary": true,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "AI and Legal Practice",
   "temporary": true,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Arbitration",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Blockchain, Cryptocurrency, and the Law",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Civil Pretrial Practice and Advocacy",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Client Counseling",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Contract Drafting with M&A Focus",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Corporate Compliance",
   "temporary": true,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Criminal Litigation",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Estate Planning: Applied Skills",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Higher Ed Law Practice",
   "temporary": false,
   "terms": [
    "FA25",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Immigration Court Practice",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "International Commercial Arbitration (Experiential effective Fall 2026)",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Law Practice Management",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Litigation Skills",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "ML Practicum: Interviewing Skills",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Mediation of Environmental and Public Conflicts",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Medical Malpractice Workshop",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Military Trial Practice",
   "temporary": true,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Negotiation and Dispute Resolution Design",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Negotiation/Mediation",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Real Estate Negotiation and Drafting",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Representing the Entrepreneur",
   "temporary": false,
   "terms": [
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Research Writing Judicial Clerks",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Researching Admin Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Special Education Litigation",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Strategic Legal Research",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Transactional Writing and Drafting",
   "temporary": false,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Trauma Informed Lawyering",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Trial Advocacy",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWEXP",
   "name": "Winning Written Advocacy",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXT",
   "name": "Externship Placement",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWEXT",
   "name": "Semester in Practice",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWLLM",
   "name": "Introduction to the United States Legal System",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWLLM",
   "name": "LL.M. Legal Analysis, Writing and Research",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Civil Procedure",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Constitutional Law I",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Contracts",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Criminal Law",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Legal Analysis & Writing I",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Legal Analysis & Writing II",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Legal Research",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Pathways to Legal Success",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Professional Responsibility",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Property",
   "temporary": false,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Race & Equal Protection of the Law",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWREQ",
   "name": "Torts",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWSAB",
   "name": "Study Abroad",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Access to Justice and Equity",
   "temporary": true,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Child Welfare Seminar",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Education Law Seminar",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Federal Crimes Seminar",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Health Justice Seminar",
   "temporary": true,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Health Law, Policy and Ethics in Aging Seminar",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Human Rights, Intersectionality, & the Law",
   "temporary": false,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "International Human Rights Seminar",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Law and Technology Seminar",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Law of Artistic Persons and Properties Seminar",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Law and the Holocaust Seminar",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Life and the Law Seminar",
   "temporary": true,
   "terms": [
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Policy Issues in Corporate Crime Seminar",
   "temporary": false,
   "terms": [
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Regulatory & Legislative Practice Seminar",
   "temporary": false,
   "terms": [
    "FA25",
    "SP26",
    "FA26",
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Standards of Review Seminar",
   "temporary": true,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Sustainable Development and the Law Seminar",
   "temporary": true,
   "terms": [
    "SP26",
    "SP27"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Tax Policy Seminar",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "The Lawyer's Role In Helping Close The Minority-White Gap In Business Ownership",
   "temporary": false,
   "terms": [
    "SP26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "The United Nations and International Law Seminar",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Trans Rights Seminar",
   "temporary": true,
   "terms": [
    "FA25"
   ]
  },
  {
   "prefix": "LWSEM",
   "name": "Workers' Compensation Law Seminar",
   "temporary": false,
   "terms": [
    "FA25",
    "FA26"
   ]
  }
 ]
};
