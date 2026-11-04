/**
 * data/concentrations.js — the 22 University Park concentrations for J.D. students admitted before
 * Fall 2025, copied from "Concentrations - (University Park), Students admitted Prior to Fall 2025"
 * (Dickinson Law Intranet PDF, October 2026 copy in the Concentration Planning Kit).
 *
 * Titles are VERBATIM from the PDF (including its inconsistencies such as "Trans Right Seminar");
 * engine.js normalizes them through match.js and rules.js titleAliases. To update: edit the lists
 * here, then run  node grad-audit/tools/check-data.mjs  to see which entries match a catalog course.
 *
 *   courses  — counted automatically when a student's course title matches (grade C or better).
 *   clinics  — same, for LWCLI clinics.
 *   other    — externships, moot court, etc. These need Associate Dean approval that the work related
 *              to the concentration, so the page LISTS them but never counts them automatically.
 */
export default {
 "_readme": "Concentrations - University Park, students admitted prior to Fall 2025. J.D.: minimum 12 credits; C or better in each course; students may earn multiple concentrations; unlisted courses need Associate Dean for Academic Affairs approval (petition) BEFORE the application. Deadlines 2026-27: Fall graduates 11/20/2026, Spring graduates 03/05/2027. 'courses'/'clinics' are copied verbatim from the PDF; 'other' items (externships etc.) need Associate Dean approval and are shown but never auto-counted.",
 "source": "Concentrations (UP, admitted before Fall 2025).pdf, intranet copy October 2026",
 "minCredits": 12,
 "minGrade": "C",
 "deadlines": {
  "fall2026": "2026-11-20",
  "spring2027": "2027-03-05"
 },
 "concentrations": [
  {
   "name": "Administrative Law and the Regulatory State",
   "courses": [
    "Administrative Law",
    "Agricultural Law",
    "American Indian Law",
    "Asylum & Refugee Law",
    "Bankruptcy",
    "Climate Change Law & Policy",
    "Corporate Compliance",
    "Corporate Social Responsibility",
    "Disabilities Law",
    "Election Law",
    "Employment Discrimination",
    "Energy Law & Policy",
    "Environmental Law",
    "Equal Protection & Civil Rights",
    "Federal Regulatory & Legislative Practice Seminar",
    "Federal Securities Regulation",
    "Food and Drug Regulation",
    "Government Contracts Practice and Litigation",
    "Health Law (Formerly Introduction to Health Law)",
    "Immigration Court Practice",
    "Immigration Law",
    "Internet Law",
    "Information Security Law",
    "International Telecommunications & Space Law",
    "Labor Law",
    "Land Use Regulation",
    "Mediation of Environmental and Public Conflicts",
    "Natural Resources Law",
    "Oil and Gas Law",
    "PILOT Lab Class",
    "Regulation of Financial Institutions",
    "Researching Administrative Law",
    "Special Education Litigation",
    "Standards of Review",
    "Statutory Interpretation Seminar",
    "Tax Policy",
    "Telecommunications Law & Regulation",
    "Veterans Benefits Law",
    "Water Law & Policy"
   ],
   "clinics": [
    "Advanced Center for Immigrants' Rights Clinic",
    "Center for Immigrants' Rights Clinic",
    "Veterans & Servicemembers Legal Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Advocacy and Litigation",
   "courses": [
    "Advanced Evidence",
    "Advanced Legal Writing",
    "Advanced LLM Legal Analysis, Writing and Research",
    "Civil Pre-Trial Practice and Advocacy",
    "Civil Procedure (LLMs Only)",
    "Class Actions Seminar",
    "Client Counseling",
    "Common Law Reasoning and Statutory Interpretation Seminar",
    "Criminal Litigation",
    "Criminal Procedure (LLMs only)",
    "Electronic Evidence Seminar",
    "Employment Discrimination",
    "Evidence",
    "Federal Court Practice",
    "Global Lawyering in the 21st Century",
    "Government Contracts Practice and Litigation",
    "Handling Cases in the Real World",
    "Higher Education Law Practice",
    "Human Rights, Intersectionality, and the Law",
    "Immigration Court Practice",
    "Insurance Law",
    "International Litigation and Arbitration",
    "Introduction to IP",
    "Labor Law",
    "Litigation Skills: Cross-Examination, Direct-Examination, and Deposition Preparation Practicum",
    "Mediation of Environmental & Public Conflicts",
    "Medical Malpractice Workshop",
    "Military Trial Practice",
    "Modern In-House Counsel",
    "National Security Law II",
    "PILOT Lab Class",
    "Remedies",
    "Representing the Professional Athlete",
    "Special Education Litigation",
    "Standards of Review Seminar",
    "Strategic Legal Research",
    "Street Law",
    "Supreme Court Seminar",
    "The Employment Relationship",
    "Trial Advocacy",
    "Winning Written Advocacy"
   ],
   "clinics": [
    "Advanced Entrepreneur Assistance Clinic",
    "Advanced Family Law Clinic",
    "Advanced Immigration Clinic",
    "Arts, Sports & Entertainment Law Clinic",
    "Center for Immigrants' Rights Clinic",
    "Civil Rights Appellate Clinic",
    "Criminal Appellate and Post-Conviction Services Clinic",
    "Entrepreneur Assistance Clinic",
    "Family Law Clinic",
    "Indigent Criminal Justice Trial Clinic",
    "Indigent Criminal Justice Trial Simulation",
    "Manglona Lab for Gender and Economic Equity",
    "Rural Economic Development Clinic"
   ],
   "other": [
    "Appellate Moot Court Board",
    "Externships*",
    "Externships Everywhere*",
    "Mock Trial Competitions",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Antitrust and Competition Law",
   "courses": [
    "Antitrust",
    "Business Planning for Mergers & Acquisitions I",
    "Business Planning for M&A II Seminar",
    "Corporate Valuation in M&A",
    "Corporations",
    "Health Law (Formerly Introduction to Health Law)",
    "Patent Law",
    "Sports Law",
    "Trademarks"
   ],
   "clinics": [],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Arbitration, Mediation, and Negotiation",
   "courses": [
    "Arbitration",
    "Civil Pre-Trial Practice and Advocacy",
    "Client Counseling",
    "Contracts (LL.M. Students Only)",
    "Employment Discrimination",
    "Family Law",
    "Handling Cases in the Real World",
    "Higher Education Law Practice",
    "International Commercial Arbitration",
    "International Investment Treaty Arbitration",
    "International Law",
    "International Litigation & Arbitration",
    "Juvenile Law (Formerly Children and the Law)",
    "Mediation of Environmental & Public Conflicts",
    "National Security Law II",
    "Negotiation & Dispute Resolution Design",
    "Real Estate Negotiation and Drafting",
    "Representing the Professional Athlete",
    "Sports Law",
    "The U.S. Law of Arbitration"
   ],
   "clinics": [
    "Advanced Entrepreneur Assistance Clinic",
    "Advanced Family Law Clinic",
    "Art, Sports, and Entertainment Law Clinic",
    "Entrepreneur Assistance Clinic",
    "Family Law Clinic",
    "Manglona Lab for Gender and Economic Equity",
    "Rural Economic Development Clinic",
    "Veterans & Servicemembers Legal Clinic"
   ],
   "other": [
    "Arbitration Law Review",
    "Externships*",
    "Externships Everywhere*",
    "Institute for Arbitration Law and Practice",
    "Penn State Law International Arbitration Group",
    "Semester in Washington*",
    "Willem C. Vis Moot Court Team"
   ]
  },
  {
   "name": "Arts, Sports, and Entertainment Law",
   "courses": [
    "Copyrights",
    "Introduction to Intellectual Property",
    "Labor Law",
    "Law of Artistic Persons & Properties Seminar",
    "Licensing of Intellectual Property",
    "Representing the Professional Athlete",
    "Sports Law",
    "Trademarks"
   ],
   "clinics": [
    "Arts, Sports, and Entertainment Law Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Banking and Financial Regulation",
   "courses": [
    "Bankruptcy",
    "Corporate Compliance",
    "Federal Securities Regulation",
    "International Financial Law Seminar",
    "Introduction to Private Wealth",
    "Payment Systems and Financial Transactions",
    "Regulation of Financial Institutions",
    "Secured Transactions"
   ],
   "clinics": [],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Commercial Law",
   "courses": [
    "Advanced Corporate Law",
    "Agricultural Law",
    "Bankruptcy",
    "Business Entities I: Unincorporated Business Entities",
    "Business Planning for M&A I",
    "Business Planning for M&A II Seminar",
    "Contracts (LLM students only)",
    "Contract Drafting",
    "Contract Drafting (M&A Focus)",
    "Corporate Compliance",
    "Corporate & Partnership Tax",
    "Corporate Social Responsibility",
    "Corporate Valuation in M&A",
    "Corporations",
    "International Bankruptcy",
    "Insurance Law",
    "International Commercial Arbitration",
    "International Financial Law Seminar",
    "Law at the Dawn of AI (special topic)",
    "Law & Finance",
    "Minority Business Ownership",
    "Modern In-House Counsel",
    "Payment Systems & Financial Transactions",
    "Policy Issues in Corporate Crime",
    "Real Estate Negotiation and Drafting",
    "Regulation of Financial Institutions",
    "Remedies",
    "Representing the Entrepreneur",
    "Sales",
    "Secured Transactions",
    "White-Collar Crime"
   ],
   "clinics": [
    "Advanced Entrepreneur Assistance Clinic",
    "Advanced International Sustainable Development Projects Clinic",
    "Entrepreneur Assistance Clinic",
    "Intellectual Property Clinic",
    "International Sustainable Development Projects Clinic",
    "Rural Economic Development Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Corporate Law and Practice",
   "courses": [
    "Advanced Corporate Law",
    "Antitrust",
    "Business Entities I: Unincorporated Business Entities",
    "Business Planning for Mergers & Acquisitions I",
    "Business Planning for Mergers & Acquisitions II Seminar",
    "Contract Drafting (M&A focus)",
    "Corporate Compliance",
    "Corporate & Partnership Tax",
    "Corporate Social Responsibility",
    "Corporate Valuation in M&A",
    "Corporations",
    "Employee Benefits and Equity Compensation",
    "Federal Securities Regulation",
    "Insurance Law",
    "International Financial Law Seminar",
    "Introduction to Private Wealth Planning",
    "Labor Law",
    "Law and Finance (formerly Law and Accounting)",
    "Law of Employee Benefits",
    "Multinational Corporations",
    "Modern In-House Counsel",
    "Policy Issues in Corporate Crime Seminar",
    "Regulation of Financial Institutions",
    "Representing the Entrepreneur",
    "White-Collar Crime",
    "Workers' Compensation Law"
   ],
   "clinics": [
    "Advanced Entrepreneur Assistance Clinic",
    "Entrepreneur Assistance Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Constitutional Law and Civil Rights",
   "courses": [
    "Administrative Law",
    "Advanced Criminal Procedure",
    "American Indian Law",
    "Comparative Constitutional Law Seminar",
    "Constitutional Law I (LLMs Only)",
    "Critical Race & Feminist Legal Theory",
    "Disabilities Law",
    "Education Law",
    "Election Law",
    "Employment Discrimination",
    "Equal Protection & Civil Rights",
    "Family Law",
    "Federal Courts",
    "Federal Court Practice",
    "Federal Crimes",
    "First Amendment",
    "Higher Education Law and Practice",
    "Human Rights, Intersectionality, and the Law",
    "Immigration Law",
    "International Human Rights Seminar",
    "Juvenile Law (Formerly Children and the Law)",
    "Law and (In)equity",
    "Law and Sexuality",
    "Law of the Police Seminar",
    "National Security Law I (Foundations)",
    "National Security Law II",
    "Special Education Litigation",
    "Street Law",
    "The Constitutional Law of Religion",
    "The Supreme Court Seminar",
    "Trans Right Seminar"
   ],
   "clinics": [
    "Advanced Immigration Clinic",
    "Center for Immigrants' Rights Clinic",
    "Civil Rights Appellate Clinic",
    "Criminal Appellate & Post-Conviction Services Clinic",
    "Indigent Criminal Justice Trial Clinic",
    "Manglona Lab for Gender and Economic Equity"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Criminal Law",
   "courses": [
    "Access to Justice and Equity Seminar",
    "Advanced Criminal Procedure",
    "Advanced Evidence",
    "Children and the Law",
    "Criminal Law (LLMs Only)",
    "Criminal Litigation",
    "Criminal Procedure (LLMs Only)",
    "Electronic Evidence Seminar",
    "Evidence",
    "Federal Court Practice",
    "Federal Crimes",
    "International Criminal Law",
    "Law of the Police Seminar",
    "Military Trial Practice",
    "Policy Issues in Corporate Crime Seminar",
    "Trial Advocacy",
    "White-Collar Crime"
   ],
   "clinics": [
    "Criminal Appellate and Post-Conviction Services Clinic",
    "Indigent Criminal Justice Trial Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Energy and Environmental Law",
   "courses": [
    "American Indian Law",
    "Administrative Law",
    "Agricultural Law",
    "Climate Change Law and Policy",
    "Comparative Energy Law and Justice",
    "Energy Law & Policy",
    "Environmental Law",
    "Land Use Regulation",
    "Law & Policy of Shale Gas Development",
    "Mediation of Environmental & Public Conflicts",
    "Natural Resources Law",
    "Oil and Gas Law",
    "Property (LLMs Only)",
    "Standards of Review Seminar",
    "Sustainable Dvl & Law Seminar",
    "Water Law & Policy"
   ],
   "clinics": [
    "International Sustainable Developments Clinic",
    "Rural Economic Development Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Families, Children, and the Law",
   "courses": [
    "Access to Justice and Equity Seminar",
    "Bioethics and Law",
    "Client Counseling",
    "Education Law",
    "Estate Planning: Applied Skills",
    "Family Law",
    "Gender & Sexuality",
    "Estate Tax",
    "Health Law (formerly Intro to Health Law)",
    "Human Rights, Intersectionality, and the Law",
    "Introduction to Private Wealth",
    "Juvenile Law (Formerly Children and the Law)",
    "Law & (In)Equity",
    "Law & Sexuality",
    "Public Health Law",
    "Special Education Litigation",
    "Street Law",
    "Wills, Trusts, & Estates"
   ],
   "clinics": [
    "Advanced Center for Immigrants' Rights",
    "Advanced Family Law Clinic",
    "Center for Immigrants' Rights",
    "Family Law",
    "Manglona Lab for Gender and Economic Equity"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Health Law",
   "courses": [
    "Access to Justice and Equity Seminar",
    "Administrative Law",
    "Bioethics & Law",
    "Biotechnology Law",
    "Disabilities Law",
    "Environmental Law",
    "Food and Drug Regulation",
    "Gender & Sexuality",
    "Health Justice Seminar",
    "Health Law (Formerly Introduction to Health Law)",
    "Insurance Law",
    "Medical Malpractice Workshop",
    "Juvenile Law (Formerly Children and the Law)",
    "Law and Sexuality",
    "Public Health Law",
    "Special Education Litigation",
    "Trans Rights Seminar",
    "Wills, Trusts, and Estates",
    "Workers' Compensation Law"
   ],
   "clinics": [
    "Advanced Family Law Clinic",
    "Advanced Veterans and Servicemembers Legal Clinic",
    "Family Law Clinic",
    "Manglona Lab for Gender and Economic Equity",
    "Veterans and Servicemembers Legal Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Immigration and Migration",
   "courses": [
    "Administrative Law",
    "Asylum & Refugee Law",
    "Constitutional Law I (LL.M. Students Only)",
    "Immigration Court Practice",
    "Immigration Law",
    "International Law",
    "International Criminal Law",
    "International Human Rights Seminar",
    "The United Nations & International Law Seminar"
   ],
   "clinics": [
    "Advanced Immigration Clinic",
    "Center for Immigrants' Rights Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Intellectual Property",
   "courses": [
    "Biotechnology Law",
    "Blockchain, Cryptocurrency Law",
    "Copyrights",
    "Corporate Compliance",
    "Food and Drug Regulation",
    "Information Security Law",
    "Internet Law",
    "Introduction to Intellectual Property",
    "Law of Artistic Persons and Properties Seminar",
    "Law at the Dawn of AI (special topic)",
    "Licensing of Intellectual Property",
    "Patent Law",
    "Policy Innovation Lab of Tomorrow (PILoT) Lab Class",
    "Property (LLMs Only)",
    "Representing the Entrepreneur",
    "Representing the Professional Athlete",
    "Trademarks",
    "USPTO's Patent Bar Course"
   ],
   "clinics": [
    "Advanced Entrepreneur Assistance Clinic",
    "Advanced Intellectual Property Clinic",
    "Arts, Sports, and Entertainment Law Clinic",
    "Entrepreneur Assistance Clinic",
    "Intellectual Property Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "International, Foreign, and Comparative Law",
   "courses": [
    "Asylum and Refugee Law",
    "Comparative Constitutional Law",
    "Comparative Energy Law and Justice",
    "Conflict of Laws",
    "Corporate Social Responsibility",
    "European Union Law Seminar",
    "Global Lawyering in the 21st Century",
    "Immigration Law",
    "International Bankruptcy",
    "International Commercial Arbitration",
    "International Criminal Law",
    "International Financial Law Seminar",
    "International Human Rights Seminar",
    "International Law",
    "International Litigation & Arbitration",
    "International Telecommunications & Space Law",
    "International Trade Law",
    "Investment Treaty Arbitration",
    "Multinational Corporations",
    "National Security Law I (Foundations)",
    "National Security Law II (Leadership in Crisis Simulation)",
    "Spanish for Lawyers",
    "Sustainable Dvl & Law Seminar",
    "The Supreme Court in Comparative Perspective Seminar",
    "United Nations and International Law Seminar"
   ],
   "clinics": [
    "Advanced International Sustainable Development Projects Clinic",
    "Advanced Center for Immigrants' Rights",
    "Center for Immigrants' Rights",
    "International Sustainable Development Projects Clinic"
   ],
   "other": [
    "International Law Society",
    "Jessup International Law Moot Court competition",
    "Penn State Journal of Law and International Affairs",
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Labor and Employment Law",
   "courses": [
    "Arbitration",
    "Corporate Social Responsibility",
    "Employee Benefits & Equity Compensation",
    "Employment Discrimination",
    "Handling Cases in the Real World",
    "Higher Education Law Practice",
    "Labor Law",
    "Modern In-House Counsel",
    "Representing the Professional Athlete",
    "The Employment Relationship",
    "The Law of Employee Benefits",
    "The U.S. Law of Arbitration",
    "Workers' Compensation Law"
   ],
   "clinics": [
    "Civil Rights Appellate Clinic",
    "Manglona Lab for Gender and Economic Equity"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Law, Science, and Technology",
   "courses": [
    "Bioethics & Law",
    "Biotechnology Law",
    "Energy Law & Policy",
    "Environmental Law",
    "Food and Drug Regulation",
    "Handling Cases in the Real World",
    "Health Law (formerly Intro to Health Law)",
    "Information Security Law",
    "Internet Law",
    "International Telecommunications and Space Law",
    "Introduction to Intellectual Property",
    "Law at the Dawn of AI (special topic)",
    "Licensing of Intellectual Property",
    "Mediation of Environmental & Public Conflicts",
    "Natural Resources Law",
    "Negotiation and Dispute Resolution Design",
    "Oil and Gas Law",
    "Patent Law",
    "Payment Systems and Financial Transactions",
    "PILOT Lab Class",
    "Public Health Law",
    "Telecommunications Law & Regulation",
    "Water Law & Policy"
   ],
   "clinics": [
    "Advanced Intellectual Property Clinic",
    "Intellectual Property Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "National Security, Military, and Veterans",
   "courses": [
    "Asylum & Refugee Law",
    "Conflict of Laws",
    "International Law",
    "International Criminal Law",
    "Military Trial Practice",
    "National Security Law I (Foundations)",
    "National Security Law II (Leadership in Crisis Simulation)",
    "The Military, Law, & National Security Seminar",
    "Veterans Benefits Law"
   ],
   "clinics": [
    "Advanced Veterans & Servicemembers Legal Clinic",
    "Veterans & Servicemembers Legal Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Public Interest Law",
   "courses": [
    "Access to Justice and Equity Seminar",
    "Advanced Criminal Procedure",
    "Asylum & Refugee Law",
    "Bioethics and the Law",
    "Client Counseling",
    "Climate Change Law & Policy",
    "Constitutional Law I (LLMs Only)",
    "Critical Race & Feminist Legal Theory",
    "Disabilities Law",
    "Education Law",
    "Election Law",
    "Employment Discrimination",
    "Environmental Law",
    "Equal Protection & Civil Rights",
    "Family Law",
    "Federal Crimes",
    "First Amendment",
    "Health Justice Seminar",
    "Health Law (formerly Intro to Health Law)",
    "Higher Education Law Practice",
    "Human Rights, Intersectionality & the Law",
    "Immigration Law",
    "Information Security Law",
    "International Human Rights Seminar",
    "International Criminal Law",
    "International Law",
    "Juvenile Law (Formerly Children and the Law)",
    "Labor Law",
    "Land Use Regulation",
    "Law and Sexuality",
    "Law of the Police Seminar",
    "Mediation of Environmental and Public Conflicts",
    "Minority Business Ownership",
    "Natural Resources Law",
    "National Security Law I",
    "National Security Law II",
    "Negotiation and Dispute Resolution Design",
    "Nonprofit Orgs Law",
    "PILOT Lab Class",
    "Researching Admin Law",
    "Special Education Litigation",
    "Street Law",
    "The United Nations and International Law Seminar",
    "Trans Rights Seminar",
    "Veterans Benefits",
    "Water Law & Policy"
   ],
   "clinics": [
    "Advanced Family Law",
    "Advanced Immigration Clinic",
    "Advanced International Sustainable Development Projects Clinic",
    "Advanced Veterans and Servicemembers Legal Clinic",
    "Center for Immigrants' Rights Clinic",
    "Civil Rights Appellate Clinic",
    "Family Law Clinic",
    "Indigent Criminal Justice Trial Clinic",
    "International Sustainable Development Projects Clinic",
    "Manglona Lab for Gender and Economic Equity",
    "Rural Economic Development Clinic",
    "Veterans and Servicemembers Legal Clinic"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Race, Law, and Equity",
   "courses": [
    "Access to Justice and Equity Seminar",
    "American Indian Law",
    "Asylum and Refugee Law",
    "Bioethics and Law",
    "Comparative Constitutional Law Seminar",
    "Constitutional Law II (Equal Protection & Civil Rights)",
    "Critical Race & Feminist Legal Theory",
    "Disabilities Law",
    "Education Law",
    "Election Security Seminar",
    "Health Justice Seminar",
    "Human Rights, Intersectionality, & the Law",
    "Immigration Court Practice",
    "Law & (In)equity",
    "Law and Sexuality",
    "Law of the Police Seminar",
    "Employment Discrimination",
    "Immigration Law",
    "International Human Rights Seminar",
    "Mediation of Environmental and Public Conflicts",
    "Minority Business Ownership",
    "Native American Law",
    "Negotiation & Dispute Resolution Design",
    "Poverty and the Law",
    "Property & Poverty Seminar",
    "Renewable Energy Law & Energy Justice",
    "Special Education Litigation",
    "Trans Rights Seminar"
   ],
   "clinics": [
    "Center for Immigrants Rights Clinic",
    "Civil Rights Appellate Clinic",
    "Criminal Appellate and Post-Conviction Services Clinic",
    "Indigent Criminal Justice Trial Clinic",
    "Manglona Lab for Gender and Economic Equity"
   ],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  },
  {
   "name": "Taxation",
   "courses": [
    "Basic Federal Income Taxation",
    "Blockchain, Cryptocurrency Law",
    "Business Planning for Mergers & Acquisitions I",
    "Business Planning for M&A II Seminar",
    "Corporate & Partnership Tax",
    "Corporate Valuation in M&A",
    "Employee Benefits and Equity Compensation",
    "Estate Tax",
    "International Tax Policy",
    "Introduction to Private Wealth Planning",
    "Minority Business Ownership",
    "Nonprofit Orgs Law",
    "Representing the Entrepreneur",
    "Tax Policy Seminar",
    "The Law of Employee Benefits",
    "Wills, Trusts, & Estates"
   ],
   "clinics": [],
   "other": [
    "Externships*",
    "Externships Everywhere*",
    "Semester in Washington*"
   ]
  }
 ]
};
