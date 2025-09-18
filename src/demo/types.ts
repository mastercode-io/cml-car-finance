export interface DemoFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;

  // Computed fields
  age?: number;
  fullName?: string;
  annualSalary?: number;

  // Employment
  currentStatus?: 'employed' | 'self-employed' | 'unemployed' | 'student';
  employer?: string;
  position?: string;
  salary?: number;
  startDate?: string;

  // Experience
  yearsExperience?: number;
  keySkills?: string;
  highlightProjects?: string;

  // Education
  highestDegree?: 'high-school' | 'associates' | 'bachelors' | 'masters' | 'doctorate';
  institution?: string;
  graduationYear?: number;
  gpa?: number;

  // Preferences
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  remotePreference?: 'remote' | 'hybrid' | 'onsite';
  salaryExpectation?: number;
  availabilityDate?: string;
  relocate?: boolean;
  preferredLocation?: string;

  // Legal & Agreements
  workAuthorization?: boolean;
  requiresSponsorship?: boolean;
  backgroundCheckConsent: boolean;
  confirmAccuracy: boolean;

  // Additional
  coverLetter?: string;
}
