import React, { useEffect, useState } from "react";

import {
  User,
  BriefcaseBusiness,
  Building2,
} from "lucide-react";

import { House} from "lucide-react";

interface ReviewStartProps {
  onBack?: () => void;
  onHome?: () => void;
  onStartInterview?: () => void;

  candidate?: CandidateData;
  formData?: FormData;
}

/* =========================================================
   CANDIDATE DATA
========================================================= */

interface CandidateData {
  fullName: string;
  email: string;
  phone: string;
  experience: string;
  currentRole: string;
  currentCompany: string;
  skills: string;
  summary: string;
}

/* =========================================================
   FORM DATA FROM NEW INTERVIEW
========================================================= */

interface FormData {
  role: string;
  domain: string;
  managerEmail: string;
  domainExperience: string;
}

/* =========================================================
   COMPLETE INTERVIEW DATA
========================================================= */

interface InterviewData {
  candidate: CandidateData;
  formData: FormData;
}

/* =========================================================
   QUESTION
========================================================= */

interface Question {
  id: number;
  domain: string;
  difficulty: string;
  experienceMin: number;
  experienceMax: number;
  question: string;
}

/* =========================================================
   API RESPONSE
========================================================= */

interface SampleQuestionsResponse {
  success: boolean;
  domain: string;
  experience: number;
  questions: Question[];
}

/* =========================================================
   COMPONENT
========================================================= */

const ReviewStart: React.FC<ReviewStartProps> = ({
  onBack,
  onHome,
  onStartInterview,
  //candidate: externalCandidate,
 // formData: externalFormData,
}) => {
  /* =====================================================
     STATE
  ===================================================== */

  const [interviewData, setInterviewData] =
    useState<InterviewData | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [loadingQuestions, setLoadingQuestions] =
    useState(false);

  const [questionError, setQuestionError] =
    useState("");

  /*
     IMPORTANT:
     This controls the ACTUAL interview length.

     It is completely separate from the
     4 sample questions shown below.
  */
  const [numberOfQuestions, setNumberOfQuestions] =
    useState<number>(10);

  /* =====================================================
     LOAD INTERVIEW DATA
  ===================================================== */

  useEffect(() => {
    try {
      const savedData = sessionStorage.getItem(
        "intellihire_interview_data"
      );

      if (!savedData) {
        console.warn(
          "No interview data found in sessionStorage."
        );

        return;
      }

      const parsedData: InterviewData =
        JSON.parse(savedData);

      console.log(
        "ReviewStart interview data:",
        parsedData
      );

      setInterviewData(parsedData);

    } catch (error) {
      console.error(
        "Unable to load interview data:",
        error
      );
    }
  }, []);

  /* =====================================================
     EXTRACT DATA
  ===================================================== */

  const candidate =
    interviewData?.candidate;

  const formData =
    interviewData?.formData;

  /* =====================================================
     CONVERT EXPERIENCE RANGE TO NUMBER
  ===================================================== */

  const convertExperienceToNumber = (
    experience: string
  ): number | null => {
    if (!experience) {
      return null;
    }

    const value = experience
      .toLowerCase()
      .replace(/years?/g, "")
      .replace(/\s+/g, " ")
      .trim();

    /* ---------------------------------------------
       8+ Years
    --------------------------------------------- */

    const plusMatch = value.match(
      /(\d+(?:\.\d+)?)\s*\+/
    );

    if (plusMatch) {
      return Number(plusMatch[1]);
    }

    /* ---------------------------------------------
       Range: 2-5
    --------------------------------------------- */

    const rangeMatch = value.match(
      /(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/
    );

    if (rangeMatch) {
      const min = Number(rangeMatch[1]);
      const max = Number(rangeMatch[2]);

      return (min + max) / 2;
    }

    /* ---------------------------------------------
       Single number: 3
    --------------------------------------------- */

    const numberMatch = value.match(
      /(\d+(?:\.\d+)?)/
    );

    if (numberMatch) {
      return Number(numberMatch[1]);
    }

    return null;
  };

  /* =====================================================
     FETCH SAMPLE QUESTIONS
     
     IMPORTANT:
     These are ONLY SAMPLE QUESTIONS.

     Backend returns 4 sample questions.

     They are NOT controlled by numberOfQuestions.
  ===================================================== */

  useEffect(() => {
    if (!interviewData) {
      return;
    }

    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        setQuestionError("");
        setQuestions([]);

        const domain =
          interviewData.formData.domain?.trim();

        const experienceText =
          interviewData.formData.domainExperience?.trim();

        /* ---------------------------------------------
           VALIDATE DOMAIN
        --------------------------------------------- */

        if (!domain) {
          setQuestionError(
            "Interview domain is not available."
          );

          return;
        }

        /* ---------------------------------------------
           CONVERT EXPERIENCE
        --------------------------------------------- */

        const experience =
          convertExperienceToNumber(
            experienceText
          );

        if (experience === null) {
          setQuestionError(
            "Interview experience is not available."
          );

          return;
        }

        console.log(
          "Loading sample questions:",
          {
            domain,
            experienceText,
            experience,
          }
        );

        /* ---------------------------------------------
           CALL FASTAPI
        --------------------------------------------- */

        const response = await fetch(
          `https://intellihire-backend-pyb0.onrender.com/api/sample-questions?domain=${encodeURIComponent(
            domain
          )}&experience=${encodeURIComponent(
            experience
          )}`
        );

        /* ---------------------------------------------
           HTTP ERROR
        --------------------------------------------- */

        if (!response.ok) {
          let errorMessage =
            "Could not load sample questions.";

          try {
            const errorData =
              await response.json();

            if (errorData?.detail) {
              errorMessage =
                errorData.detail;
            }
          } catch {
            // Ignore JSON parsing error
          }

          throw new Error(
            errorMessage
          );
        }

        /* ---------------------------------------------
           READ RESPONSE
        --------------------------------------------- */

        const data: SampleQuestionsResponse =
          await response.json();

        console.log(
          "Sample questions API response:",
          data
        );

        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        if (
          data.success &&
          Array.isArray(data.questions)
        ) {
          /*
             Keep ONLY the 4 sample questions.

             This is intentionally independent
             from numberOfQuestions.
          */

          setQuestions(
            data.questions.slice(0, 4)
          );

          if (data.questions.length === 0) {
            setQuestionError(
              `No sample questions found for domain "${domain}" and experience "${experienceText}".`
            );
          }

        } else {
          setQuestionError(
            "No sample questions found."
          );
        }

      } catch (error) {
        console.error(
          "Unable to load sample questions:",
          error
        );

        setQuestionError(
          error instanceof Error
            ? error.message
            : "Unable to load sample questions."
        );

      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();

  }, [interviewData]);

  /* =====================================================
     NUMBER OF QUESTIONS CHANGE
     
     This value controls the ACTUAL interview.

     It does NOT affect the 4 sample questions.
  ===================================================== */

  const handleQuestionCountChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = Number(event.target.value);

    setNumberOfQuestions(value);

    console.log(
      "Actual interview question count:",
      value
    );
  };

  /* =====================================================
     START INTERVIEW
  ===================================================== */

  /* =====================================================
       START INTERVIEW
    ===================================================== */
    
    const handleStartInterview = () => {
      console.log("START INTERVIEW BUTTON CLICKED");
    
      if (!interviewData) {
        console.log("Interview data not loaded.");
        return;
      }
    
      /*
         Save the selected interview length.
      */
    
      const updatedInterviewData = {
        ...interviewData,
    
        interviewSettings: {
          numberOfQuestions,
        },
    
        sampleQuestions: questions,
      };
    
      sessionStorage.setItem(
        "intellihire_interview_data",
        JSON.stringify(updatedInterviewData)
      );
    
      console.log(
        "Starting interview with:",
        updatedInterviewData
      );
    
      console.log(
        "Actual interview question count:",
        numberOfQuestions
      );
    
      /*
         Navigate to Live Interview.
      */
    
      onStartInterview?.();
    };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="review-page">

      {/* =====================================================
          NAVBAR
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

      <section className="review-page-header">

        <button
          type="button"
          className="back-button"
          onClick={onBack}
        >
        
          ←
        </button>


        <div className="review-title">

          <h1>
            Review &amp; Start Interview
          </h1>

          <p>
            Review and customize the questions for this interview.
          </p>

        </div>


        {/* STEP INDICATOR */}

        <div className="review-step-indicator">

          {/* STEP 1 */}

          <button
            type="button"
            className="review-step"
            onClick={onBack}
          >

            <div className="review-step-number">
              1
            </div>

            <div className="review-step-text">

              <strong>
                Candidate Details
              </strong>

              <span>
                Upload &amp; Review
              </span>

            </div>

          </button>


          <div className="review-step-line"></div>


          {/* STEP 2 */}

          <div className="review-step review-step-active">

            <div className="review-step-number">
              2
            </div>

            <div className="review-step-text">

              <strong>
                Review &amp; Start
              </strong>

              <span>
                AI Generated
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="review-main">


        {/* =====================================================
            LEFT HALF - CANDIDATE PREVIEW
        ===================================================== */}

        <section className="review-left">

          <div className="candidate-preview-card">


            {/* CANDIDATE PREVIEW HEADER */}

            <div className="candidate-preview-header">

              <div className="candidate-preview-icon">
                <User size={16} />
              </div>

              <div>

                <h2>
                  Candidate Preview
                </h2>

                <p>
                  Review the candidate details extracted from resume
                  and additional information.
                </p>

              </div>

            </div>


            <div className="candidate-preview-divider"></div>


            {/* EXTRACTED CANDIDATE DETAILS */}

            <section className="preview-section">

              <h3>
                Extracted Candidate Details
              </h3>


              <div className="preview-details-grid">


                {/* FULL NAME */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      <User size={16} />
                    </span>

                    Full Name

                  </span>

                  <strong>
                    {candidate?.fullName ||
                      "Not available"}
                  </strong>

                </div>


                {/* EMAIL */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ✉
                    </span>

                    Email

                  </span>

                  <strong>
                    {candidate?.email ||
                      "Not available"}
                  </strong>

                </div>


                {/* PHONE */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ☎
                    </span>

                    Phone

                  </span>

                  <strong>
                    {candidate?.phone ||
                      "Not available"}
                  </strong>

                </div>


                {/* EXPERIENCE */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ◷
                    </span>

                    Total Experience

                  </span>

                  <strong>
                    {candidate?.experience ||
                      "Not available"}
                  </strong>

                </div>


                {/* CURRENT ROLE */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      <BriefcaseBusiness size={16} />
                    </span>

                    Current Role

                  </span>

                  <strong>
                    {candidate?.currentRole ||
                      "Not available"}
                  </strong>

                </div>


                {/* CURRENT COMPANY */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      <Building2 size={16} />
                    </span>

                    Current Company

                  </span>

                  <strong>
                    {candidate?.currentCompany ||
                      "Not available"}
                  </strong>

                </div>


                {/* KEY SKILLS */}

                <div className="preview-detail-row preview-skills-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ✦
                    </span>

                    Key Skills

                  </span>

                  <strong>
                    {candidate?.skills ||
                      "Not available"}
                  </strong>

                </div>

              </div>

            </section>


            <div className="candidate-preview-divider"></div>


            {/* ADDITIONAL INFORMATION */}

            <section className="preview-section additional-preview-section">

              <h3>
                Additional Information
              </h3>


              <div className="preview-details-grid">


                {/* ROLE */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ◆
                    </span>

                    Role / Position

                  </span>

                  <strong>
                    {formData?.role ||
                      "Not available"}
                  </strong>

                </div>


                {/* DOMAIN */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ◉
                    </span>

                    Domain for this interview

                  </span>

                  <strong>
                    {formData?.domain ||
                      "Not available"}
                  </strong>

                </div>


                {/* MANAGER EMAIL */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ✉
                    </span>

                    Manager Email

                  </span>

                  <strong>
                    {formData?.managerEmail ||
                      "Not available"}
                  </strong>

                </div>


                {/* DOMAIN EXPERIENCE */}

                <div className="preview-detail-row">

                  <span className="preview-detail-label">

                    <span className="preview-icon">
                      ◷
                    </span>

                    Experience in this domain

                  </span>

                  <strong>
                    {formData?.domainExperience ||
                      "Not available"}
                  </strong>

                </div>

              </div>

            </section>

          </div>

        </section>


        {/* =====================================================
            RIGHT HALF - QUESTIONS
        ===================================================== */}

        <section className="review-right">


          {/* =================================================
              NUMBER OF QUESTIONS
              
              THIS CONTROLS THE ACTUAL INTERVIEW LENGTH.
              
              IT IS SEPARATE FROM SAMPLE QUESTIONS.
          ================================================= */}

          <div className="question-settings">

            <div className="question-count-field">

              <label>
                Number of Questions for Interview
              </label>

              <select
                value={numberOfQuestions}
                onChange={
                  handleQuestionCountChange
                }
              >
                <option value={2}>
                  2 Questions
                </option>

                <option value={5}>
                  5 Questions
                </option>

                <option value={10}>
                  10 Questions
                </option>

                <option value={15}>
                  15 Questions
                </option>

                <option value={20}>
                  20 Questions
                </option>

                <option value={25}>
                  25 Questions
                </option>

                <option value={30}>
                  30 Questions
                </option>

              </select>

            </div>

          </div>


          {/* =================================================
              SAMPLE QUESTIONS
              
              THESE ARE ONLY EXAMPLES.
              
              THEY ARE NOT THE ACTUAL INTERVIEW QUESTIONS.
              
              THEY DO NOT CONTROL INTERVIEW LENGTH.
          ================================================= */}

          <div className="sample-questions-section">

            <h2>
              Sample Questions
            </h2>

            


            {/* LOADING */}

            {loadingQuestions && (

              <div className="sample-question-list">

                <div className="sample-question">
                  Loading sample questions...
                </div>

              </div>

            )}


            {/* ERROR */}

            {!loadingQuestions &&
              questionError && (

                <div className="sample-question-list">

                  <div
                    className="sample-question"
                    style={{
                      color: "#d93025",
                    }}
                  >
                    {questionError}
                  </div>

                </div>

              )}


            {/* SAMPLE QUESTIONS */}

            {!loadingQuestions &&
              !questionError &&
              questions.length > 0 && (

                <div className="sample-question-list">

                  {questions
                    .slice(0, 4)
                    .map(
                      (
                        question,
                        index
                      ) => (

                        <div
                          className="sample-question"
                          key={question.id}
                        >

                          {index + 1}.{" "}
                          {question.question}

                        </div>

                      )
                    )}

                </div>

              )}


            {/* EMPTY */}

            {!loadingQuestions &&
              !questionError &&
              questions.length === 0 && (

                <div className="sample-question-list">

                  <div className="sample-question">
                    No sample questions found.
                  </div>

                </div>

              )}

          </div>


          {/* =================================================
              START INTERVIEW
          ================================================= */}

          <button
              type="button"
              className="start-interview-button"
              onClick={handleStartInterview}
            >
              Start Interview
            
              <span>
                →
              </span>
            </button>

        </section>

      </main>

    </div>
  );
};

export default ReviewStart;
