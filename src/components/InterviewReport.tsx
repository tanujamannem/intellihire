import React, { useEffect, useState } from "react";
import "../InterviewReport.css";
import html2pdf from "html2pdf.js";

import {

  Send,
  Plus,
  X,
  Download,
} from "lucide-react";

// =========================================================
// TYPES
// =========================================================

interface CandidateData {
  fullName?: string;
  email?: string;
  phone?: string;
  experience?: string;
  currentRole?: string;
  currentCompany?: string;
  skills?: string;
  summary?: string;
}

interface FormData {
  role?: string;
  domain?: string;
  managerEmail?: string;
  domainExperience?: string;
}

interface InterviewData {
  candidate?: CandidateData;
  formData?: FormData;
  sessionId?: string;
  numberOfQuestions?: number;

  interviewSettings?: {
    numberOfQuestions?: number;
  };

  sampleQuestions?: {
    question?: string;
  }[];
}

interface InterviewAnswer {
  questionNumber: number;
  question: string;
  answer: string;
  score: number | null;
  feedback: string;
  isFollowup: boolean;
}

interface StoredInterviewReport {
  sessionId?: string;

  candidate?: CandidateData;

  role?: string;
  domain?: string;
  experience?: string;

  totalQuestions?: number;

  answers?: InterviewAnswer[];

  completedAt?: string;

  generatedReport?: GeneratedReport;

  overallScore?: number | string | null;

  summary?: string;

  strengths?: string[];

  weaknesses?: string[];

  feedback?: string;

  recommendation?: string;

  generatedAt?: string;

  savedAt?: string;

  submittedAt?: string;
}

interface GeneratedReport {
  overall_score?: number | string;
  overallScore?: number | string;
  score?: number | string;

  summary_text?: string;
  summary?: string;

  strengths?: string[] | string;

  weaknesses?: string[] | string;

  areas_of_improvement?: string[] | string;
  areasOfImprovement?: string[] | string;

  feedback?: string;

  final_comments?: string;
  finalComments?: string;

  recommendation?: string;
}

interface SavedReport {
  id: string;

  sessionId?: string;

  candidate?: CandidateData;

  role: string;

  domain: string;

  experience: string;

  totalQuestions: number;

  answers: InterviewAnswer[];

  overallScore: number | null;

  summary: string;

  strengths: string[];

  weaknesses: string[];

  feedback: string;

  recommendation: string;

  savedAt: string;

  generatedAt?: string;

  submittedAt?: string;

  completedAt?: string;

  candidateName?: string;

  candidateEmail?: string;

  candidatePhone?: string;

  mode?: string;
}

interface InterviewReportProps {
  onBack?: () => void;
  onFinish?: () => void;
  onClose?: () => void;

  candidate?: CandidateData;
  formData?: FormData;
}

// =========================================================
// CONSTANTS
// =========================================================

const API_BASE_URL =
  "http://127.0.0.1:8000";

const REPORT_STORAGE_KEY =
  "intellihire_interview_report";

const INTERVIEW_DATA_STORAGE_KEY =
  "intellihire_interview_data";

export const SAVED_REPORTS_STORAGE_KEY =
  "intellihire_saved_reports";

// =========================================================
// HELPERS
// =========================================================

const normalizeList = (
  value?: string[] | string
): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|•/)
      .map((item) =>
        item
          .replace(/^[-*]\s*/, "")
          .trim()
      )
      .filter(Boolean);
  }

  return [];
};

// =========================================================
// SCORE
// =========================================================

const getScore = (
  report: GeneratedReport
): number | null => {
  const value =
    report.overall_score ??
    report.overallScore ??
    report.score;

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(10, numericValue)
  );
};

// =========================================================
// COMPONENT
// =========================================================

const InterviewReport: React.FC<
  InterviewReportProps
> = ({
  onBack,
  onFinish,
  onClose,
 
}) => {
  // =======================================================
  // DATA
  // =======================================================

  const [interviewData, setInterviewData] =
    useState<InterviewData | null>(null);

  const [
    storedInterviewReport,
    setStoredInterviewReport,
  ] = useState<StoredInterviewReport | null>(
    null
  );

  // =======================================================
  // REPORT STATE
  // =======================================================

  const [overallScore, setOverallScore] =
    useState<number | null>(null);

  const [summary, setSummary] =
    useState("");

  const [strengths, setStrengths] =
    useState<string[]>([]);

  const [weaknesses, setWeaknesses] =
    useState<string[]>([]);

  const [feedback, setFeedback] =
    useState("");

  const [recommendation, setRecommendation] =
    useState("");

  // =======================================================
  // UI STATE
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  //const [saving, setSaving] =
   // useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [savedMessage, setSavedMessage] =
    useState("");

  // =======================================================
  // LOAD
  // =======================================================

  useEffect(() => {
    loadInterviewAndGenerateReport();
  }, []);

  // =========================================================
  // LOAD INTERVIEW DATA
  // =========================================================

  const loadInterviewAndGenerateReport =
    async () => {
      setLoading(true);
      setError("");

      try {
        const interviewDataStorage =
          sessionStorage.getItem(
            INTERVIEW_DATA_STORAGE_KEY
          );

        if (!interviewDataStorage) {
          throw new Error(
            "Interview data was not found."
          );
        }

        const parsedInterviewData:
          InterviewData =
          JSON.parse(
            interviewDataStorage
          );

        setInterviewData(
          parsedInterviewData
        );

        // ---------------------------------------------------
        // LOAD STORED CURRENT REPORT
        // ---------------------------------------------------

        const reportStorage =
          sessionStorage.getItem(
            REPORT_STORAGE_KEY
          );

        let parsedStoredReport:
          StoredInterviewReport = {};

        if (reportStorage) {
          try {
            parsedStoredReport =
              JSON.parse(
                reportStorage
              );

            setStoredInterviewReport(
              parsedStoredReport
            );
          } catch (parseError) {
            console.warn(
              "Could not parse stored report.",
              parseError
            );
          }
        }

        const answers =
          parsedStoredReport.answers || [];

        // ---------------------------------------------------
        // GENERATE REPORT
        // ---------------------------------------------------

        await generateReport(
          parsedInterviewData,
          parsedStoredReport,
          answers
        );
      } catch (loadError) {
        console.error(
          "Failed to load interview:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load interview report."
        );

        loadSavedReport();
      } finally {
        setLoading(false);
      }
    };

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const generateReport = async (
    interviewDataInput: InterviewData,
    storedReport: StoredInterviewReport,
    answers: InterviewAnswer[]
  ) => {
    try {
      const interviewPayload = {
        candidate: interviewDataInput.candidate || {},
        formData: interviewDataInput.formData || {},
        role:
          interviewDataInput.formData?.role ||
          interviewDataInput.candidate?.currentRole ||
          "",
        domain:
          interviewDataInput.formData?.domain ||
          "",
        experience:
          interviewDataInput.formData?.domainExperience ||
          interviewDataInput.candidate?.experience ||
          "",
        totalQuestions:
          interviewDataInput.interviewSettings?.numberOfQuestions ||
          interviewDataInput.numberOfQuestions ||
          storedReport.totalQuestions ||
          0,
        answers,
        sessionId:
          interviewDataInput.sessionId ||
          storedReport.sessionId ||
          "",
      };

      const response = await fetch(
        `${API_BASE_URL}/api/generate-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interview_data: interviewPayload,
          }),
        }
      );

      const responseText = await response.text();

      let reportResponse: any = {};

      try {
        reportResponse = JSON.parse(responseText);
      } catch {
        console.error(
          "Generate report returned non-JSON response:",
          responseText
        );
      }

      if (!response.ok || !reportResponse.success) {
        throw new Error(
          reportResponse.message ||
            reportResponse.error ||
            reportResponse.detail ||
            `Report generation failed with status ${response.status}`
        );
      }

      const generatedReport: GeneratedReport =
        reportResponse.report || {};

      populateReport(generatedReport);

      const generatedStrengths = normalizeList(
        generatedReport.strengths
      );

      const generatedWeaknesses = normalizeList(
        generatedReport.weaknesses ||
          generatedReport.areas_of_improvement ||
          generatedReport.areasOfImprovement
      );

      const savedReport: StoredInterviewReport = {
        ...interviewPayload,
        generatedReport,
        overallScore: getScore(generatedReport) ?? undefined,
        summary:
          generatedReport.summary_text ||
          generatedReport.summary ||
          "",
        strengths: generatedStrengths,
        weaknesses: generatedWeaknesses,
        feedback:
          generatedReport.feedback ||
          generatedReport.final_comments ||
          generatedReport.finalComments ||
          "",
        recommendation:
          generatedReport.recommendation ||
          "",
        generatedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        REPORT_STORAGE_KEY,
        JSON.stringify(savedReport)
      );

      setStoredInterviewReport(savedReport);
    } catch (generationError) {
      console.error(
        "AI report generation error:",
        generationError
      );

      loadSavedReport();

      setError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate AI interview report."
      );
    }
  };
  // =========================================================
  // POPULATE REPORT
  // =========================================================

  const populateReport = (
    report: GeneratedReport
  ) => {
    setOverallScore(
      getScore(report)
    );

    setSummary(
      report.summary_text ||
        report.summary ||
        ""
    );

    setStrengths(
      normalizeList(
        report.strengths
      )
    );

    setWeaknesses(
      normalizeList(
        report.weaknesses ||
          report.areas_of_improvement ||
          report.areasOfImprovement
      )
    );

    setFeedback(
      report.feedback ||
        report.final_comments ||
        report.finalComments ||
        ""
    );

    setRecommendation(
      report.recommendation ||
        ""
    );
  };

  // =========================================================
  // LOAD SAVED CURRENT REPORT
  // =========================================================

  const loadSavedReport = () => {
    try {
      const saved =
        sessionStorage.getItem(
          REPORT_STORAGE_KEY
        );

      if (!saved) {
        return;
      }

      const report =
        JSON.parse(saved);

      const savedScore =
        report.overallScore ??
        report.overall_score ??
        report.score;

      if (
        savedScore !== undefined &&
        savedScore !== null
      ) {
        const numericScore =
          Number(savedScore);

        if (
          !Number.isNaN(
            numericScore
          )
        ) {
          setOverallScore(
            Math.max(
              0,
              Math.min(
                10,
                numericScore
              )
            )
          );
        }
      }

      setSummary(
        report.summary ||
          report.summary_text ||
          ""
      );

      setStrengths(
        normalizeList(
          report.strengths
        )
      );

      setWeaknesses(
        normalizeList(
          report.weaknesses ||
            report.areas_of_improvement ||
            report.areasOfImprovement
        )
      );

      setFeedback(
        report.feedback ||
          report.final_comments ||
          report.finalComments ||
          ""
      );

      setRecommendation(
        report.recommendation ||
          ""
      );

      setStoredInterviewReport(
        report
      );
    } catch (loadError) {
      console.error(
        "Failed to load saved report:",
        loadError
      );
    }
  };

  // =========================================================
  // CANDIDATE DATA
  // =========================================================

  const candidate =
    interviewData?.candidate;

  const formData =
    interviewData?.formData;

  const candidateName =
    candidate?.fullName ||
    "Candidate";

  const candidateEmail =
    candidate?.email ||
    "Not provided";

  const candidatePhone =
    candidate?.phone ||
    "Not provided";

  const role =
    formData?.role ||
    candidate?.currentRole ||
    "Not specified";

  const domain =
    formData?.domain ||
    "Not specified";

  const experience =
    formData?.domainExperience ||
    candidate?.experience ||
    "Not specified";

  const managerEmail =
    formData?.managerEmail ||
    "";

  const sessionId =
    interviewData?.sessionId ||
    storedInterviewReport?.sessionId ||
    "";

  // =========================================================
  // ANSWERS
  // =========================================================

  //const interviewAnswers =
  //  storedInterviewReport?.answers || [];

  // =========================================================
  // DATE
  // =========================================================

  const generatedDate =
    storedInterviewReport?.generatedAt
      ? new Date(
          storedInterviewReport.generatedAt
        )
      : new Date();

  const formattedDate =
    generatedDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
      }
    );

  const formattedTime =
    generatedDate.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );

  // =========================================================
  // STRENGTH HANDLERS
  // =========================================================

  const updateStrength = (
    index: number,
    value: string
  ) => {
    setStrengths(
      (previous) =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? value
              : item
        )
    );
  };

  const addStrength = () => {
    setStrengths(
      (previous) => [
        ...previous,
        "",
      ]
    );
  };

  const removeStrength = (
    index: number
  ) => {
    setStrengths(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  };

  // =========================================================
  // IMPROVEMENT HANDLERS
  // =========================================================

  const updateWeakness = (
    index: number,
    value: string
  ) => {
    setWeaknesses(
      (previous) =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? value
              : item
        )
    );
  };

  const addWeakness = () => {
    setWeaknesses(
      (previous) => [
        ...previous,
        "",
      ]
    );
  };

  const removeWeakness = (
    index: number
  ) => {
    setWeaknesses(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  };

  // =========================================================
  // BUILD REPORT OBJECT
  // =========================================================

  const buildReportObject =
    (): SavedReport => {
      return {
        id:
          sessionId ||
          `report-${Date.now()}`,

        sessionId,

        candidate:
          interviewData?.candidate || {},

        role,

        domain,

        experience,

        totalQuestions:
          interviewData
            ?.interviewSettings
            ?.numberOfQuestions ||
          interviewData
            ?.numberOfQuestions ||
          storedInterviewReport
            ?.totalQuestions ||
          0,

        answers:
          storedInterviewReport
            ?.answers || [],

        overallScore,

        summary:
          summary.trim(),

        strengths:
          strengths
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        weaknesses:
          weaknesses
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        feedback:
          feedback.trim(),

        recommendation:
          recommendation.trim(),

        savedAt:
          new Date().toISOString(),

        generatedAt:
          storedInterviewReport
            ?.generatedAt ||
          new Date().toISOString(),
      };
    };



// =========================================================
// SUBMIT REPORT
// =========================================================

const handleSubmitReport = async () => {
  setSubmitting(true);
  setError("");
  setSavedMessage("");

  try {
    // -------------------------------------------------------
    // BUILD FINAL REPORT
    // -------------------------------------------------------

    const finalReport = buildReportObject();

    // -------------------------------------------------------
    // SUBMIT REPORT TO BACKEND
    // -------------------------------------------------------

    const response = await fetch(
      `${API_BASE_URL}/api/submit-report`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          session_id: sessionId,

report: {

  summary_text:
    finalReport.summary,

  overall_score:
    finalReport.overallScore ?? 0,

  strengths:
    finalReport.strengths,

  weaknesses:
    finalReport.weaknesses,

  feedback:
    finalReport.feedback,

  final_comments:
    finalReport.feedback,

  recommendation:
    finalReport.recommendation ||
    "Review Interview",

  domain,

  candidate_name:
    candidateName,

  manager_email:
    managerEmail,
},

          candidate_name:
            candidateName,

          manager_email:
            managerEmail,

          send_email: true,
        }),
      }
    );

    // -------------------------------------------------------
    // READ RESPONSE
    // -------------------------------------------------------

    const responseBody =
      await response.json();

    // -------------------------------------------------------
    // CHECK SUBMISSION
    // -------------------------------------------------------

    if (
      !response.ok ||
      !responseBody.success
    ) {
      console.error(
        "SUBMIT REPORT API FAILED:",
        responseBody
      );

      throw new Error(
        responseBody.message ||
          responseBody.error ||
          responseBody.detail ||
          `Submit report failed with status ${response.status}`
      );
    }

    // =======================================================
    // SUBMISSION SUCCESSFUL
    // NOW SAVE REPORT TO HOME PAGE
    // =======================================================

    const existingReportsRaw =
      localStorage.getItem(
        SAVED_REPORTS_STORAGE_KEY
      );

    let existingReports: SavedReport[] = [];

    if (existingReportsRaw) {
      try {
        const parsed =
          JSON.parse(
            existingReportsRaw
          );

        if (Array.isArray(parsed)) {
          existingReports = parsed;
        }
      } catch (parseError) {
        console.warn(
          "Could not parse existing saved reports:",
          parseError
        );

        existingReports = [];
      }
    }

    // -------------------------------------------------------
    // CREATE UNIQUE REPORT ID
    // -------------------------------------------------------

    const uniqueReportId =
      `report_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 10)}`;

    // -------------------------------------------------------
    // CREATE SAVED REPORT
    // -------------------------------------------------------

    const submittedReport: SavedReport = {
      ...finalReport,

      id: uniqueReportId,

      sessionId:
        sessionId || "",

      savedAt:
        new Date().toISOString(),

      completedAt:
        new Date().toISOString(),

      submittedAt:
        new Date().toISOString(),

      candidateName,

      candidateEmail,

      candidatePhone,

      role,

      domain,

      experience,

      mode:
        "Video Interview",

      totalQuestions:
        storedInterviewReport
          ?.totalQuestions ||
        interviewData?.numberOfQuestions ||
        interviewData
          ?.interviewSettings
          ?.numberOfQuestions ||
        0,
    };

    // -------------------------------------------------------
    // ADD TO EXISTING HOME REPORTS
    // -------------------------------------------------------

    const updatedReports = [
      submittedReport,
      ...existingReports,
    ];

    // -------------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // -------------------------------------------------------

    localStorage.setItem(
      SAVED_REPORTS_STORAGE_KEY,
      JSON.stringify(
        updatedReports
      )
    );

    // -------------------------------------------------------
    // SAVE CURRENT REPORT TO SESSION STORAGE
    // -------------------------------------------------------

    sessionStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify(
        submittedReport
      )
    );

    // -------------------------------------------------------
    // UPDATE STATE
    // -------------------------------------------------------

    setStoredInterviewReport(
      submittedReport
    );

    // -------------------------------------------------------
    // NOTIFY HOME PAGE
    // -------------------------------------------------------

    window.dispatchEvent(
      new Event(
        "intellihire-report-saved"
      )
    );

    // =======================================================
    // SUCCESS MESSAGE
    // =======================================================

    setSavedMessage(
      responseBody.email_sent
        ? "Report submitted and sent successfully."
        : "Report submitted successfully."
    );

    // -------------------------------------------------------
    // DEBUG
    // -------------------------------------------------------

    console.log(
      "=============================================="
    );

    console.log(
      "INTERVIEW REPORT SUBMITTED + SAVED"
    );

    console.log(
      "Report ID:",
      uniqueReportId
    );

    console.log(
      "Session ID:",
      sessionId
    );

    console.log(
      "Candidate:",
      candidateName
    );

    console.log(
      "Email sent:",
      responseBody.email_sent
    );

    console.log(
      "Total saved reports:",
      updatedReports.length
    );

    console.log(
      "=============================================="
    );

    // -------------------------------------------------------
    // FINISH
    // -------------------------------------------------------

    if (onFinish) {
      onFinish();
    }

  } catch (submitError) {

    console.error(
      "Submit report error:",
      submitError
    );

    setError(
      submitError instanceof Error
        ? submitError.message
        : "Failed to submit report."
    );

  } finally {

    setSubmitting(false);

  }
};

// =========================================================
// DOWNLOAD REPORT AS PDF
// =========================================================

const handleDownloadReport = () => {
  const reportElement =
    document.querySelector(
      ".report-modal"
    ) as HTMLElement | null;

  if (!reportElement) {
    console.error(
      "Report element not found."
    );

    return;
  }

  // -------------------------------------------------------
  // Clone the report
  // -------------------------------------------------------

  const clonedReport =
    reportElement.cloneNode(
      true
    ) as HTMLElement;

  // -------------------------------------------------------
  // REMOVE UI-ONLY ELEMENTS
  // -------------------------------------------------------

  clonedReport
    .querySelectorAll(
      ".report-header-actions, .report-footer-actions, .report-close-button, .report-download-button, .add-item-button, .remove-item-button"
    )
    .forEach((element) => {
      element.remove();
    });

  // -------------------------------------------------------
  // CONVERT TEXTAREAS INTO READ-ONLY TEXT
  // -------------------------------------------------------

  clonedReport
    .querySelectorAll(
      "textarea"
    )
    .forEach((textarea) => {
      const textareaElement =
        textarea as HTMLTextAreaElement;

      const value =
        textareaElement.value ||
        textarea.textContent ||
        "";

      const paragraph =
        document.createElement("p");

      paragraph.textContent = value;

      paragraph.className =
        textarea.className;

      textarea.replaceWith(
        paragraph
      );
    });

  // -------------------------------------------------------
  // CONVERT RECOMMENDATION SELECT
  // INTO PLAIN TEXT
  // -------------------------------------------------------

  clonedReport
    .querySelectorAll(
      "select"
    )
    .forEach((select) => {
      const selectElement =
        select as HTMLSelectElement;

      const selectedValue =
        selectElement.value ||
        recommendation ||
        "Not specified";

      const recommendationText =
        document.createElement("div");

      recommendationText.className =
        "downloaded-recommendation";

      recommendationText.textContent =
        selectedValue;

      select.replaceWith(
        recommendationText
      );
    });

  // -------------------------------------------------------
  // CREATE TEMPORARY PDF CONTAINER
  // -------------------------------------------------------

  const pdfContainer =
    document.createElement("div");

  pdfContainer.style.position =
    "fixed";

  pdfContainer.style.left =
    "-100000px";

  pdfContainer.style.top = "0";

  pdfContainer.style.width =
    "1040px";

  pdfContainer.style.background =
    "#ffffff";

  pdfContainer.style.padding =
    "0";

  pdfContainer.style.margin =
    "0";

  pdfContainer.style.overflow =
    "visible";

  // -------------------------------------------------------
  // PDF-SPECIFIC STYLES
  // -------------------------------------------------------

  const pdfStyle =
    document.createElement("style");

  pdfStyle.textContent = `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .report-modal-overlay {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      background: #ffffff !important;
      display: block !important;
    }

    .report-modal {
      width: 100% !important;
      max-width: none !important;
      height: auto !important;
      min-height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
    }

    .report-header {
      position: relative !important;
      width: 100% !important;
      flex-shrink: 0 !important;
    }

    .report-document {
      width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      padding: 30px 58px 36px !important;
    }

    .report-header-actions,
    .report-footer-actions,
    .report-close-button,
    .report-download-button,
    .add-item-button,
    .remove-item-button,
    .report-footer {
      display: none !important;
    }

    textarea,
    input,
    select {
      border: none !important;
      outline: none !important;
      background: transparent !important;
      resize: none !important;
      pointer-events: none !important;
      font-family: Arial, Helvetica, sans-serif !important;
      color: inherit !important;
    }

    .overall-score-input {
      border: none !important;
      outline: none !important;
      background: transparent !important;
    }

    .downloaded-recommendation {
      display: inline-block !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      color: inherit !important;
      padding: 8px 0 !important;
      pointer-events: none !important;
      user-select: text !important;
    }

    .document-textarea,
    .list-textarea {
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      white-space: pre-wrap !important;
    }

    .transcript-item {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .candidate-section,
    .document-section,
    .recommendation-section {
      break-inside: auto;
    }

    .two-column-section {
      break-inside: auto;
    }

    @media print {
      .report-modal {
        box-shadow: none !important;
      }
    }
  `;

  pdfContainer.appendChild(
    pdfStyle
  );

  pdfContainer.appendChild(
    clonedReport
  );

  document.body.appendChild(
    pdfContainer
  );

  // -------------------------------------------------------
  // PDF FILE NAME
  // -------------------------------------------------------

  const safeCandidateName =
    candidateName
      .replace(
        /[^a-z0-9]/gi,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      )
      .replace(
        /^_|_$/g,
        ""
      );

  const fileName =
    `Interview_Report_${safeCandidateName || "Candidate"}.pdf`;

  // -------------------------------------------------------
  // PDF OPTIONS
  // -------------------------------------------------------

  const pdfOptions = {
    margin: [10, 10, 10, 10] as [number, number, number, number],

    filename: fileName,

    image: {
      type: "jpeg" as const,
      quality: 0.98,
    },

    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait" as const,
    },

    pagebreak: {
      mode: [
        "css",
        "legacy",
      ],
    },
  };

  // -------------------------------------------------------
  // GENERATE PDF
  // -------------------------------------------------------

  html2pdf()
    .set(pdfOptions)
    .from(clonedReport)
    .save()
    .then(() => {
      // ---------------------------------------------------
      // REMOVE TEMPORARY CONTAINER
      // ---------------------------------------------------

      if (
        pdfContainer.parentNode
      ) {
        pdfContainer.parentNode.removeChild(
          pdfContainer
        );
      }
    })
    .catch((error) => {
      console.error(
        "Failed to generate PDF:",
        error
      );

      if (
        pdfContainer.parentNode
      ) {
        pdfContainer.parentNode.removeChild(
          pdfContainer
        );
      }
    });
};
  // =========================================================
  // HTML ESCAPE
  // =========================================================

  //function escapeHtml(
    //value: string
 // ): string {
   // return value
     // .replace(
       // /&/g,
       // "&amp;"
      //)
      //.replace(
       // /</g,
        //"&lt;"
      //)
      //.replace(
        ///>/g,
       // "&gt;"
     // )
     // .replace(
       // /"/g,
       // "&quot;"
     // )
      //.replace(
        ///'/g,
        //"&#039;"
      //);
  //}

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="report-modal-overlay">

        <div className="report-loading-card">

          <div className="report-spinner" />

          <h2>
            Generating Interview Report
          </h2>

          <p>
            Analyzing interview responses...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // REPORT
  // =========================================================

  return (
    <div className="report-modal-overlay">

      <div className="report-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="report-header">

          <div className="report-brand">

            <div className="mirafra-name">
              mirafra
            </div>

            <div className="mirafra-technologies">
              TECHNOLOGIES
            </div>

          </div>

          <div className="report-heading">

            <h1>
              IntelliHire - Interview Report
            </h1>

            <div className="report-generated">

              Generated on{" "}
              {formattedDate}

              <span>
                •
              </span>

              {formattedTime}

            </div>

          </div>

          <div className="report-score">

  <span>
    Overall Score
  </span>

  <div className="editable-score-container">

    <input
      type="number"
      min="0"
      max="10"
      step="0.1"
      value={
        overallScore !== null
          ? overallScore
          : ""
      }
      onChange={(e) => {
        const value = e.target.value;

        if (value === "") {
          setOverallScore(null);
          return;
        }

        const numericValue = Number(value);

        if (!Number.isNaN(numericValue)) {
          setOverallScore(
            Math.max(
              0,
              Math.min(10, numericValue)
            )
          );
        }
      }}
      className="overall-score-input"
    />

    <small>
      / 10
    </small>

  </div>

</div>

          {/* =================================================
              TOP RIGHT DOWNLOAD + CLOSE
          ================================================= */}

          <div className="report-header-actions">

            <button
              type="button"
              className="report-download-button"
              onClick={
                handleDownloadReport
              }
              aria-label="Download report"
              title="Download report"
            >
              <Download size={18} />
            </button>

            <button
              type="button"
              className="report-close-button"
              onClick={
                onClose ||
                onBack
              }
              aria-label="Close report"
            >
              <X size={20} />
            </button>

          </div>

        </header>

        {/* =================================================
            DOCUMENT
        ================================================= */}

        <main className="report-document">

          {/* =================================================
              CANDIDATE DETAILS
          ================================================= */}

          <section className="document-section candidate-section">

            <div className="section-title-row">

              <h2>
                Candidate Details
              </h2>

            </div>

            <div className="candidate-grid">

              <div className="candidate-field">

                <span>
                  Name
                </span>

                <strong>
                  {candidateName}
                </strong>

              </div>

              <div className="candidate-field">

                <span>
                  Role
                </span>

                <strong>
                  {role}
                </strong>

              </div>

              <div className="candidate-field">

                <span>
                  Email
                </span>

                <strong>
                  {candidateEmail}
                </strong>

              </div>

              <div className="candidate-field">

                <span>
                  Domain
                </span>

                <strong>
                  {domain}
                </strong>

              </div>

              <div className="candidate-field">

                <span>
                  Phone
                </span>

                <strong>
                  {candidatePhone}
                </strong>

              </div>

              <div className="candidate-field">

                <span>
                  Experience
                </span>

                <strong>
                  {experience}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              SUMMARY
          ================================================= */}

          <section className="document-section">

            <h2>
              Summary
            </h2>

            <textarea
              className="document-textarea summary-input"
              value={summary}
              onChange={(e) =>
                setSummary(
                  e.target.value
                )
              }
              placeholder="AI-generated interview summary will appear here..."
            />

          </section>

          

          {/* =================================================
              STRENGTHS + IMPROVEMENT
          ================================================= */}

          <section className="document-section">

            <div className="two-column-section">

              {/* =================================================
                  STRENGTHS
              ================================================= */}

              <div className="report-column">

                <h2>
                  Strengths
                </h2>

                <div className="report-list">

                  {strengths.length ===
                    0 && (
                    <div className="empty-report-message">

                      No strengths observed.

                    </div>
                  )}

                  {strengths.map(
                    (
                      strength,
                      index
                    ) => (

                      <div
                        className="editable-list-row"
                        key={`strength-${index}`}
                      >

                        <span className="bullet">
                          •
                        </span>

                        <textarea
                          value={
                            strength
                          }
                          onChange={(
                            e
                          ) =>
                            updateStrength(
                              index,
                              e.target.value
                            )
                          }
                          className="list-textarea"
                          placeholder="Add strength"
                        />

                        <button
                          type="button"
                          className="remove-item-button"
                          onClick={() =>
                            removeStrength(
                              index
                            )
                          }
                          aria-label="Remove strength"
                        >
                          <X size={14} />
                        </button>

                      </div>

                    )
                  )}

                  <button
                    type="button"
                    className="add-item-button"
                    onClick={
                      addStrength
                    }
                    aria-label="Add strength"
                  >
                    <Plus size={16} />
                  </button>

                </div>

              </div>

              {/* =================================================
                  AREAS OF IMPROVEMENT
              ================================================= */}

              <div className="report-column">

                <h2>
                  Areas of Improvement
                </h2>

                <div className="report-list">

                  {weaknesses.length ===
                    0 && (
                    <div className="empty-report-message">

                      No areas of improvement observed.

                    </div>
                  )}

                  {weaknesses.map(
                    (
                      weakness,
                      index
                    ) => (

                      <div
                        className="editable-list-row"
                        key={`weakness-${index}`}
                      >

                        <span className="bullet">
                          •
                        </span>

                        <textarea
                          value={
                            weakness
                          }
                          onChange={(
                            e
                          ) =>
                            updateWeakness(
                              index,
                              e.target.value
                            )
                          }
                          className="list-textarea"
                          placeholder="Add improvement area"
                        />

                        <button
                          type="button"
                          className="remove-item-button"
                          onClick={() =>
                            removeWeakness(
                              index
                            )
                          }
                          aria-label="Remove improvement"
                        >
                          <X size={14} />
                        </button>

                      </div>

                    )
                  )}

                  <button
                    type="button"
                    className="add-item-button"
                    onClick={
                      addWeakness
                    }
                    aria-label="Add area of improvement"
                  >
                    <Plus size={16} />
                  </button>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              INTERVIEWER FEEDBACK
          ================================================= */}

          <section className="document-section">

            <h2>
              Interviewer Feedback
            </h2>

            <textarea
              className="document-textarea feedback-input"
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
              placeholder="Add interviewer feedback..."
            />

          </section>

          {/* =================================================
              RECOMMENDATION
          ================================================= */}

          <section className="recommendation-section">

            <div className="recommendation-inner">

              <div>

                <h2>
                  Hiring Recommendation
                </h2>

              

              </div>

              <select
                value={
                  recommendation
                }
                onChange={(e) =>
                  setRecommendation(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Select recommendation
                </option>

                <option value="Strong Hire">
                  Strong Hire
                </option>

                <option value="Hire">
                  Hire
                </option>

                <option value="Consider">
                  Consider
                </option>

                <option value="No Hire">
                  No Hire
                </option>

              </select>

            </div>

          </section>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="report-error">
              {error}
            </div>
          )}

        </main>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="report-footer">

          <div className="report-footer-date">

            <span>
              {formattedDate}
            </span>

            {savedMessage && (
              <span className="saved-message">

                ✓{" "}
                {savedMessage}

              </span>
            )}

          </div>

          {/* =================================================
              SAVE + SUBMIT ONLY
          ================================================= */}

          <div className="report-footer-actions">

           

            <button
              type="button"
              className="submit-report-button"
              onClick={
                handleSubmitReport
              }
              disabled={submitting}
            >

              <Send size={17} />

              {
                submitting
                  ? "Submitting..."
                  : "Submit Report"
              }

            </button>

          </div>

        </footer>

      </div>

    </div>
  );
};

export default InterviewReport;