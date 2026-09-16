import React, { useState } from "react";
 
//import { ArrowLeft } from "lucide-react";
 
import {
 
  User,
 
  BriefcaseBusiness,
 
  Building2,
 
  CloudUpload
 
} from "lucide-react";
import { House} from "lucide-react";
 
interface NewInterviewProps {
  onBack?: () => void;
  onHome?: () => void;
  onReviewStart?: () => void;

  candidate?: Candidate;
  setCandidate?: React.Dispatch<React.SetStateAction<Candidate>>;

  formData?: FormData;
  setFormData?: React.Dispatch<React.SetStateAction<FormData>>;
}
 
interface Candidate {
 
  fullName: string;
 
  email: string;
 
  phone: string;
 
  experience: string;
 
  currentRole: string;
 
  currentCompany: string;
 
  skills: string;
 
  summary: string;
 
}
 
interface FormData {
 
  role: string;
 
  domain: string;
 
  managerEmail: string;
 
  domainExperience: string;
 
}
 
const NewInterview: React.FC<NewInterviewProps> = ({
  onBack,
  onHome,
  onReviewStart,
  //candidate: externalCandidate,
  //setCandidate: externalSetCandidate,
  //formData: externalFormData,
  //setFormData: externalSetFormData,
}) => {
 
  /* =====================================================
 
     STATE
 
  ===================================================== */
 
  const [resume, setResume] = useState<File | null>(null);
 
  const [analyzing, setAnalyzing] = useState(false);
 
  const [isEditing, setIsEditing] = useState(false);
 
  const [candidate, setCandidate] = useState<Candidate>({
 
    fullName: "",
 
    email: "",
 
    phone: "",
 
    experience: "",
 
    currentRole: "",
 
    currentCompany: "",
 
    skills: "",
 
    summary: "",
 
  });
 
  const [formData, setFormData] = useState<FormData>({
 
    role: "",
 
    domain: "",
 
    managerEmail: "",
 
    domainExperience: "",
 
  });
 
  /* =====================================================
 
     RESUME UPLOAD
 
  ===================================================== */
 
  const handleResumeUpload = (
 
    event: React.ChangeEvent<HTMLInputElement>
 
  ) => {
 
    const file = event.target.files?.[0];
 
    if (!file) {
 
      return;
 
    }
 
    /* -------------------------------------------------
 
       FILE SIZE
 
    ------------------------------------------------- */
 
    const maxSize = 10 * 1024 * 1024;
 
    if (file.size > maxSize) {
 
      alert("File size should not exceed 10MB.");
 
      return;
 
    }
 
    /* -------------------------------------------------
 
       FILE TYPE
 
    ------------------------------------------------- */
 
    const allowedTypes = [
 
      "application/pdf",
 
      "application/msword",
 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 
    ];
 
    const allowedExtensions = [
 
      ".pdf",
 
      ".doc",
 
      ".docx",
 
    ];
 
    const fileName = file.name.toLowerCase();
 
    const validType =
 
      allowedTypes.includes(file.type) ||
 
      allowedExtensions.some((extension) =>
 
        fileName.endsWith(extension)
 
      );
 
    if (!validType) {
 
      alert(
 
        "Please upload a PDF, DOC, or DOCX file."
 
      );
 
      return;
 
    }
 
    setResume(file);
 
  };
 
  /* =====================================================
 
     DELETE RESUME
 
  ===================================================== */
 
  const handleDeleteResume = () => {
 
    setResume(null);
 
    setAnalyzing(false);
 
    setCandidate({
 
      fullName: "",
 
      email: "",
 
      phone: "",
 
      experience: "",
 
      currentRole: "",
 
      currentCompany: "",
 
      skills: "",
 
      summary: "",
 
    });
 
  };
 
  /* =====================================================
 
     ANALYZE RESUME
 
  ===================================================== */
 
  const handleAnalyze = async () => {
 
    if (!resume || analyzing) {
 
      return;
 
    }
 
    try {
 
      setAnalyzing(true);
 
      const resumeFormData = new FormData();
 
      resumeFormData.append(
 
        "resume",
 
        resume
 
      );
 
      const response = await fetch(
  "https://intellihire-backend-pyb0.onrender.com/api/analyze-resume", 
 
        {
 
          method: "POST",
 
          body: resumeFormData,
 
        }
 
      );
 
      if (!response.ok) {
 
        let errorMessage =
 
          "Resume analysis failed.";
 
        try {
 
          const errorData =
 
            await response.json();
 
          errorMessage =
 
            errorData.detail ||
 
            errorMessage;
 
        } catch {
 
          // Ignore JSON parsing error
 
        }
 
        throw new Error(errorMessage);
 
      }
 
      const data = await response.json();
 
      console.log(
 
        "Resume analysis response:",
 
        data
 
      );
 
      if (
 
        !data.success ||
 
        !data.candidate
 
      ) {
 
        throw new Error(
 
          "Invalid response from resume analyzer."
 
        );
 
      }
 
      setCandidate({
 
        fullName:
 
          data.candidate.fullName || "",
 
        email:
 
          data.candidate.email || "",
 
        phone:
 
          data.candidate.phone || "",
 
        experience:
 
          data.candidate.experience || "",
 
        currentRole:
 
          data.candidate.currentRole || "",
 
        currentCompany:
 
          data.candidate.currentCompany || "",
 
        skills:
 
          data.candidate.skills || "",
 
        summary:
 
          data.candidate.summary || "",
 
      });
 
    } catch (error) {
 
      console.error(
 
        "Resume analysis error:",
 
        error
 
      );
 
      alert(
 
        error instanceof Error
 
          ? error.message
 
          : "Unable to analyze resume."
 
      );
 
    } finally {
 
      setAnalyzing(false);
 
    }
 
  };
 
  /* =====================================================
 
     FORM INPUT CHANGE
 
  ===================================================== */
 
  const handleInputChange = (
 
    event: React.ChangeEvent<
 
      HTMLInputElement | HTMLSelectElement
>
 
  ) => {
 
    const {
 
      name,
 
      value,
 
    } = event.target;
 
    setFormData((previous) => ({
 
      ...previous,
 
      [name]: value,
 
    }));
 
  };
 
  /* =====================================================
 
     CANDIDATE INPUT CHANGE
 
  ===================================================== */
 
  const handleCandidateChange = (
 
    event: React.ChangeEvent<HTMLInputElement>
 
  ) => {
 
    const {
 
      name,
 
      value,
 
    } = event.target;
 
    setCandidate((previous) => ({
 
      ...previous,
 
      [name]: value,
 
    }));
 
  };
 
  /* =====================================================
 
     VALIDATION
 
  ===================================================== */
 
  const isAdditionalInfoComplete =
 
    formData.role.trim() !== "" &&
 
    formData.domain !== "" &&
 
    formData.managerEmail !== "" &&
 
    formData.domainExperience !== "";
 
  const canReviewAndStart =
 
    resume !== null &&
 
    isAdditionalInfoComplete;
 
  /* =====================================================
 
     SAVE INTERVIEW DATA
 
  ===================================================== */
 
  const saveInterviewData = () => {
 
    const interviewData = {
 
      candidate: {
 
        fullName: candidate.fullName,
 
        email: candidate.email,
 
        phone: candidate.phone,
 
        experience: candidate.experience,
 
        currentRole: candidate.currentRole,
 
        currentCompany:
 
          candidate.currentCompany,
 
        skills: candidate.skills,
 
        summary: candidate.summary,
 
      },
 
      formData: {
 
        role: formData.role,
 
        domain: formData.domain,
 
        managerEmail:
 
          formData.managerEmail,
 
        domainExperience:
 
          formData.domainExperience,
 
      },
 
    };
 
    console.log(
 
      "Saving interview data:",
 
      interviewData
 
    );
 
    sessionStorage.setItem(
 
      "intellihire_interview_data",
 
      JSON.stringify(interviewData)
 
    );
 
  };
 
  /* =====================================================
 
     REVIEW & START
 
  ===================================================== */
 
  const handleReviewStart = () => {
 
    if (!resume) {
 
      alert(
 
        "Please upload a resume first."
 
      );
 
      return;
 
    }
 
    if (!isAdditionalInfoComplete) {
 
      alert(
 
        "Please fill in all the required additional details."
 
      );
 
      return;
 
    }
 
    /*
 
      Save all candidate and interview
 
      information before moving to
 
      Review & Start.
 
    */
 
    saveInterviewData();
 
    onReviewStart?.();
 
  };
 
  /* =====================================================
 
     RETURN UI
 
  ===================================================== */
 
  return (
<div className="new-interview-page">
 
      {/* =====================================================
 
          TOP NAVBAR
 
      ===================================================== */}
 
      <header className="navbar">
 
        <div className="navbar-left">
 
          <div className="navbar-logo">
 
            <div className="mirafra-name">
 
              mirafra
</div>
 
            <div className="mirafra-tech">
 
              TECHNOLOGIES
</div>
 
          </div>
 
          <div className="brand-divider"></div>
 
          <div className="intellihire-brand">
 
            <div className="intellihire-name">
 
              Intelli<span>Hire</span>
</div>
 
            <div className="intellihire-subtitle">
 
              AI Interviewer Assistant
</div>
 
          </div>
 
        </div>
 
 
        {/* CENTER NAVIGATION */}
 
        <nav className="navbar-center">
 
          <button
 
            type="button"
 
            className="nav-item"
 
            onClick={onHome}
>
<span className="nav-icon">
 
              <House size={21} strokeWidth={2.2} />
</span>
 
            Home
</button>
 
 
          <button
 
            type="button"
 
            className="nav-item active"
>
<span className="nav-icon">
 
              ＋
</span>
 
            New Interview
</button>
 
        </nav>
 
 
        <div className="navbar-right"></div>
 
      </header>
 
 
      {/* =====================================================
 
          PAGE HEADER
 
      ===================================================== */}
 
      <section className="new-interview-header">
 
        <button
 
          type="button"
 
          className="back-button"
 
          onClick={onBack}
>
 
          ←
</button>
 
 
        <div className="new-interview-title">
 
          <h1>
 
            New Interview
</h1>
 
          <p>
 
            Create a new AI-powered interview in just a few steps.
</p>
 
        </div>
 
 
        {/* STEP INDICATOR */}
 
        <div className="step-indicator">
 
          {/* STEP 1 */}
 
          <button
 
            type="button"
 
            className="step active"
>
 
            <div className="step-number">
 
              1
</div>
 
            <div className="step-text">
 
              <strong>
 
                Candidate Details
</strong>
 
              <span>
 
                Upload &amp; Review
</span>
 
            </div>
 
          </button>
 
 
          <div className="step-line"></div>
 
 
          {/* STEP 2 */}
 
          <button
 
            type="button"
 
            className={`step ${
 
              canReviewAndStart
 
                ? "step-enabled"
 
                : "step-disabled"
 
            }`}
 
            disabled={!canReviewAndStart}
 
            onClick={handleReviewStart}
>
 
            <div className="step-number">
 
              2
</div>
 
            <div className="step-text">
 
              <strong>
 
                Review &amp; Start
</strong>
 
              <span>
 
                AI Generated
</span>
 
            </div>
 
          </button>
 
        </div>
 
      </section>
 
 
      {/* =====================================================
 
          MAIN CONTENT
 
      ===================================================== */}
 
      <main className="new-interview-content">
 
 
        {/* ===================================================
 
            LEFT COLUMN
 
        =================================================== */}
 
        <div className="new-interview-left">
 
 
          {/* =================================================
 
              1. UPLOAD RESUME
 
          ================================================= */}
 
          <section className="interview-section">
 
            <h2>
 
              1. Upload Resume / CV
</h2>
 
 
            <div className="upload-row">
 
 
              {/* UPLOAD BOX */}
 
              <label className="resume-upload">
 
                <input
 
                  type="file"
 
                  accept=".pdf,.doc,.docx"
 
                  onChange={
 
                    handleResumeUpload
 
                  }
 
                  hidden
 
                />
 
                <div className="upload-icon">
<CloudUpload size={30} strokeWidth={2.5} />
</div>
 
                <div className="upload-text">
 
                  <strong>
 
                    Drag &amp; drop your resume here
</strong>
 
                  <span>
 
                    or <b>browse files</b>
</span>
 
                  <small>
 
                    Supports PDF, DOC, DOCX · Max 10MB
</small>
 
                </div>
 
              </label>
 
 
              {/* FILE STATUS */}
 
              <div className="resume-status">
 
                {resume ? (
<>
 
                    <div className="file-icon">
 
                      📄
</div>
 
                    <div className="file-information">
 
                      <strong
 
                        title={resume.name}
>
 
                        {resume.name}
</strong>
 
                      <span>
 
                        {(
 
                          resume.size /
 
                          1024 /
 
                          1024
 
                        ).toFixed(2)}{" "}
 
                        MB
</span>
 
                      <span className="uploaded-message">
 
                        Resume uploaded successfully
</span>
 
                    </div>
 
                    <div className="file-check">
 
                      ✓
</div>
 
 
                    {/* DELETE */}
 
                    <button
 
                      type="button"
 
                      className="delete-resume-button"
 
                      onClick={
 
                        handleDeleteResume
 
                      }
 
                      title="Remove resume"
 
                      aria-label="Remove resume"
>
 
                      ×
</button>
 
                  </>
 
                ) : (
<>
 
                    <div className="file-icon empty">
 
                      📄
</div>
 
                    <div className="file-information">
 
                      <strong>
 
                        No resume uploaded
</strong>
 
                      <span>
 
                        Upload a resume to extract candidate details
</span>
 
                    </div>
 
                  </>
 
                )}
 
              </div>
 
 
              {/* ANALYZE BUTTON */}
 
              <button
 
                type="button"
 
                className={`analyze-button ${
 
                  !resume
 
                    ? "disabled"
 
                    : ""
 
                }`}
 
                disabled={
 
                  !resume ||
 
                  analyzing
 
                }
 
                onClick={
 
                  handleAnalyze
 
                }
>
 
                {analyzing
 
                  ? "Analyzing Resume..."
 
                  : "✦ Analyze Resume"}
 
              </button>
 
            </div>
 
          </section>
         
         
 
          {/* =================================================
 
              2. EXTRACTED CANDIDATE DETAILS
 
          ================================================= */}
 
          <section className="interview-section">
 
            <div className="section-heading-row">
 
              <h2>
 
                2. Extracted Candidate Details
</h2>
 
              <button
 
                type="button"
 
                className="edit-button"
 
                onClick={() =>
 
                  setIsEditing(
 
                    (previous) =>
 
                      !previous
 
                  )
 
                }
>
 
                ✎{" "}
 
                {isEditing
 
                  ? "Done Editing"
 
                  : "Edit Details"}
 
              </button>
 
            </div>
 
 
            <div className="candidate-fields">
 
 
              {/* FULL NAME */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Full Name
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
<User size={16} />
</span>
 
                    <input
 
                      name="fullName"
 
                      value={
 
                        candidate.fullName
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* EMAIL */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Email
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
 
                      ✉
</span>
 
                    <input
 
                      name="email"
 
                      type="email"
 
                      value={
 
                        candidate.email
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* PHONE */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Phone
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
 
                      ☎
</span>
 
                    <input
 
                      name="phone"
 
                      value={
 
                        candidate.phone
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* EXPERIENCE */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Total Experience
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
 
                      ◷
</span>
 
                    <input
 
                      name="experience"
 
                      value={
 
                        candidate.experience
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* CURRENT ROLE */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Current Role
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
<BriefcaseBusiness size={16} />
</span>
 
                    <input
 
                      name="currentRole"
 
                      value={
 
                        candidate.currentRole
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* CURRENT COMPANY */}
 
              <div className="candidate-field">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Current Company
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
<Building2 size={16} />
</span>
 
                    <input
 
                      name="currentCompany"
 
                      value={
 
                        candidate.currentCompany
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
 
              {/* KEY SKILLS */}
 
              <div className="candidate-field full-width">
 
                <div className="candidate-field-content">
 
                  <label>
 
                    Key Skills
</label>
 
                  <div className="candidate-input-wrapper">
 
                    <span className="candidate-field-icon">
 
                      ✦
</span>
 
                    <input
 
                      name="skills"
 
                      value={
 
                        candidate.skills
 
                      }
 
                      onChange={
 
                        handleCandidateChange
 
                      }
 
                      placeholder="Will be extracted from resume"
 
                      readOnly={
 
                        !isEditing
 
                      }
 
                    />
 
                  </div>
 
                </div>
 
              </div>
 
            </div>
 
          </section>
 
 
          {/* =================================================
 
              3. ADDITIONAL INFORMATION
 
          ================================================= */}
 
          <section className="interview-section">
 
            <h2 className="green-section-title">
 
              3. Additional Information
 
              <span>
 
                Required
</span>
 
            </h2>
 
 
            <div className="additional-grid">
 
 
              {/* =================================================
 
                  ROLE / POSITION
 
              ================================================= */}
 
              <div className="form-field">
 
                <label>
 
                  Role/Position <b>*</b>
</label>
 
                <input
 
                  type="text"
 
                  name="role"
 
                  value={
 
                    formData.role
 
                  }
 
                  onChange={
 
                    handleInputChange
 
                  }
 
                  placeholder="Enter role / position"
 
                />
 
              </div>
 
 
              {/* =================================================
 
                DOMAIN
 
            ================================================= */}
<div className="form-field">
<label>
 
                Domain for this interview <b>*</b>
</label>
<select
 
                name="domain"
 
                value={formData.domain}
 
                onChange={handleInputChange}
>
<option value="">
 
                  Select domain
</option>
<option value="CLP">
 
                  CLP
</option>
<option value="DFT">
 
                  DFT
</option>
<option value="IR DROP">
 
                  IR DROP
</option>
<option value="LEC">
 
                  LEC
</option>
<option value="PD">
 
                  PD
</option>
<option value="PD & CAD">
 
                  PD &amp; CAD
</option>
<option value="PDCAD">
 
                  PDCAD
</option>
<option value="PDN">
 
                  PDN
</option>
<option value="PnR">
 
                  PnR
</option>
<option value="Post Silicon">
 
                  Post Silicon
</option>
<option value="PV">
 
                  PV
</option>
<option value="STA">
 
                  STA
</option>
<option value="SYN">
 
                  SYN
 
</option>
</select>
</div>
 
 
              {/* =================================================
 
                  MANAGER EMAIL
 
              ================================================= */}
 
              <div className="form-field">
 
                <label>
 
                  Manager Email <b>*</b>
</label>
 
                <select
 
                  name="managerEmail"
 
                  value={
 
                    formData.managerEmail
 
                  }
 
                  onChange={
 
                    handleInputChange
 
                  }
>
 
                  <option value="">
 
                    Select manager email
</option>
 
                  <option value="manager1@company.com">
 
                    manager1@company.com
</option>
 
                  <option value="manager2@company.com">
 
                    manager2@company.com
</option>
 
                  <option value="manager3@company.com">
 
                    manager3@company.com
</option>
 
                  <option value="manager4@company.com">
 
                    manager4@company.com
</option>
 
                </select>
 
              </div>
 
 
              {/* =================================================
 
                  DOMAIN EXPERIENCE
 
              ================================================= */}
 
              <div className="form-field">
 
                <label>
 
                  Experience in this domain <b>*</b>
</label>
 
                <select
 
                  name="domainExperience"
 
                  value={
 
                    formData.domainExperience
 
                  }
 
                  onChange={
 
                    handleInputChange
 
                  }
>
 
                  <option value="">
 
                    Select experience
</option>
 
                  <option value="0-2">
 
                    0 - 2 Years
</option>
 
                  <option value="2-5">
 
                    2 - 5 Years
</option>
 
                  <option value="5+">
 
                    5+ Years
</option>
 
                </select>
 
              </div>
 
            </div>
 
          </section>
 
        </div>
 
 
        {/* =================================================
 
            RIGHT COLUMN
 
        ================================================= */}
 
        <aside className="candidate-preview">
 
          <h2>
 
            Candidate Preview
</h2>
 
 
          {/* CANDIDATE HEADER */}
 
          <div className="preview-candidate">
 
            <div className="candidate-avatar">
 
              {candidate.fullName
 
                ? candidate.fullName
 
                    .charAt(0)
 
                    .toUpperCase()
 
                : "?"}
 
            </div>
 
 
            <div className="preview-name">
 
              <h3>
 
                {candidate.fullName ||
 
                  "Candidate Name"}
</h3>
 
              <span>
 
                {candidate.currentRole ||
 
                  "Role will appear after resume analysis"}
</span>
 
            </div>
 
          </div>
 
 
          {/* CONTACT DETAILS */}
 
          <div className="preview-details">
 
            <div>
 
              <span>
 
                ✉
</span>
 
              <p>
 
                {candidate.email ||
 
                  "Email will be extracted"}
</p>
 
            </div>
 
 
            <div>
 
              <span>
 
                ☎
</span>
 
              <p>
 
                {candidate.phone ||
 
                  "Phone will be extracted"}
</p>
 
            </div>
 
 
            <div>
 
              <span>
<span>
<Building2 size={15} />
</span>
</span>
 
              <p>
 
                {candidate.currentCompany ||
 
                  "Company will be extracted"}
</p>
 
            </div>
 
          </div>
 
 
          {/* DIVIDER */}
 
          <div className="preview-divider"></div>
 
 
          {/* RESUME SUMMARY */}
 
          <div className="resume-summary">
 
            <h2>
 
              Resume Summary
</h2>
 
            <p>
 
              {candidate.summary ||
 
                "Upload a resume to generate the candidate summary automatically."}
</p>
 
          </div>
 
 
          {/* REVIEW & START */}
 
          <button
 
            type="button"
 
            className="review-start-button"
 
            disabled={
 
              !canReviewAndStart
 
            }
 
            onClick={
 
              handleReviewStart
 
            }
>
 
            Review &amp; Start
 
            <span>
 
              →
</span>
 
          </button>
 
 
          {!canReviewAndStart && (
<p className="start-helper-text">
 
              {!resume
 
                ? "Upload a resume before starting the interview."
 
                : "Fill in all required additional details before continuing."}
 
            </p>
 
          )}
 
        </aside>
 
      </main>
 
    </div>
 
  );
 
};
 
export default NewInterview;
 
 
 
 
