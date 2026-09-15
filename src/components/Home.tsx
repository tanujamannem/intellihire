import { useEffect, useRef, useState } from "react";

import {
  Eye,
  FileText,
  MoreVertical,
  CalendarDays,
  RefreshCw,
  X,
  Download,
  Users
} from "lucide-react";


import html2pdf from "html2pdf.js";

import { ChartNoAxesCombined } from "lucide-react";

import { ClipboardCheck } from "lucide-react";

import { MessageCircle } from "lucide-react";

import { House} from "lucide-react";
// =========================================================
// PROPS
// =========================================================

interface HomeProps {
  onLogout: () => void;
  onNewInterview: () => void;
}

// =========================================================
// INTERVIEW ANSWER
// =========================================================

interface InterviewAnswer {
  questionNumber?: number;
  question?: string;

  transcript?: string;
  answer?: string;

  score?: number | null;
  feedback?: string;

  isFollowup?: boolean;
}

// =========================================================
// SAVED REPORT
// =========================================================

interface SavedReport {
  id?: string;
  sessionId?: string;

  candidate?: {
    fullName?: string;
    email?: string;
    phone?: string;
    experience?: string;
    currentRole?: string;
    currentCompany?: string;
    skills?: string;
    summary?: string;
  };

  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;

  role?: string;
  domain?: string;
  experience?: string;

  overallScore?: number | string;

  summary?: string;

  strengths?: string[];
  weaknesses?: string[];

  feedback?: string;
  recommendation?: string;

  totalQuestions?: number;

  savedAt?: string;
  completedAt?: string;

  answers?: InterviewAnswer[];
}

// =========================================================
// STORAGE
// =========================================================

const SAVED_REPORTS_KEY =
  "intellihire_saved_reports";

// =========================================================
// HOME
// =========================================================

function Home({
  
  onNewInterview,
}: HomeProps) {

  // =========================================================
  // REPORT STATE
  // =========================================================

  const [reports, setReports] =
    useState<SavedReport[]>([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedReport, setSelectedReport] =
    useState<SavedReport | null>(null);

  // =========================================================
  // TRANSCRIPT STATE
  // =========================================================

  const [
    selectedTranscriptReport,
    setSelectedTranscriptReport,
  ] = useState<SavedReport | null>(null);

  // =========================================================
  // DOWNLOAD STATE
  // =========================================================

  const [downloadingReport, setDownloadingReport] =
    useState(false);

  const [downloadingTranscript, setDownloadingTranscript] =
    useState(false);

  // =========================================================
  // DOWNLOAD REFS
  // =========================================================

  const reportDownloadRef =
    useRef<HTMLDivElement | null>(null);

  const transcriptDownloadRef =
    useRef<HTMLDivElement | null>(null);

  // =========================================================
  // LOAD REPORTS
  // =========================================================

  const loadReports = () => {
    try {
      const saved =
        localStorage.getItem(
          SAVED_REPORTS_KEY
        );

      if (!saved) {
        setReports([]);
        return;
      }

      const parsed =
        JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setReports(parsed);
      } else {
        setReports([]);
      }

    } catch (error) {

      console.error(
        "Failed to load saved reports:",
        error
      );

      setReports([]);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    loadReports();

    const handleReportSaved = () => {
      loadReports();
    };

    window.addEventListener(
      "intellihire-report-saved",
      handleReportSaved
    );

    return () => {

      window.removeEventListener(
        "intellihire-report-saved",
        handleReportSaved
      );

    };

  }, []);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {
    loadReports();
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredReports =
    reports.filter((report) => {

      const candidateName =
        report.candidateName ||
        report.candidate?.fullName ||
        "";

      const role =
        report.role ||
        report.candidate?.currentRole ||
        "";

      const domain =
        report.domain ||
        "";

      const search =
        searchTerm
          .toLowerCase()
          .trim();

      return (
        candidateName
          .toLowerCase()
          .includes(search) ||

        role
          .toLowerCase()
          .includes(search) ||

        domain
          .toLowerCase()
          .includes(search)
      );
    });

  // =========================================================
  // STATISTICS
  // =========================================================

  const interviewsConducted =
    reports.length;

  const scoredReports =
    reports.filter(
      (report) =>
        report.overallScore !==
          undefined &&
        report.overallScore !==
          null
    );

  const averageScore =
    scoredReports.length > 0
      ? scoredReports.reduce(
          (total, report) =>
            total +
            Number(
              report.overallScore ||
                0
            ),
          0
        ) /
        scoredReports.length
      : null;

  // =========================================================
  // SCORE CLASS
  // =========================================================

  const getScoreClass = (
    score: number
  ) => {

    if (score >= 7) {
      return "excellent";
    }

    if (score >= 5) {
      return "strong";
    }

    if (score >= 3) {
      return "average";
    }

    return "needs-review";
  };

  // =========================================================
  // RECOMMENDATION CLASS
  // =========================================================

  const getRecommendationClass = (
    recommendation?: string
  ) => {

    if (!recommendation) {
      return "pending";
    }

    const value =
      recommendation
        .toLowerCase()
        .replace(/\s+/g, "-");

    if (
      value === "strong-hire"
    ) {
      return "strong-hire";
    }

    if (value === "hire") {
      return "hire";
    }

    if (value === "consider") {
      return "consider";
    }

    if (
      value === "no-hire"
    ) {
      return "no-hire";
    }

    return "pending";
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (
    dateValue?: string
  ) => {

    if (!dateValue) {

      return {
        date: "--",
        time: "--",
      };
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return {
        date: "--",
        time: "--",
      };
    }

    return {

      date:
        date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        ),

      time:
        date.toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        ),
    };
  };

  // =========================================================
  // CANDIDATE INITIALS
  // =========================================================

  const getInitials = (
    name?: string
  ) => {

    if (!name) {
      return "NA";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part
          .charAt(0)
          .toUpperCase()
      )
      .join("");
  };

  // =========================================================
  // CHECK TRANSCRIPT
  // =========================================================

  const hasTranscript = (
    report: SavedReport
  ) => {

    if (
      !report.answers ||
      report.answers.length === 0
    ) {
      return false;
    }

    return report.answers.some(
      (item) => {

        const transcript =
          item.transcript ||
          item.answer ||
          "";

        return transcript
          .trim()
          .length > 0;
      }
    );
  };

  // =========================================================
  // DELETE REPORT
  // =========================================================

  const handleDeleteReport = (
    report: SavedReport
  ) => {

    const confirmed =
      window.confirm(
        `Delete interview report for ${
          report.candidateName ||
          report.candidate?.fullName ||
          "this candidate"
        }?`
      );

    if (!confirmed) {
      return;
    }

    const reportId =
      report.id ||
      report.sessionId;

    const updated =
      reports.filter(
        (item) =>
          (item.id ||
            item.sessionId) !==
          reportId
      );

    localStorage.setItem(
      SAVED_REPORTS_KEY,
      JSON.stringify(updated)
    );

    setReports(updated);

    if (
      selectedReport &&
      (
        selectedReport.id ||
        selectedReport.sessionId
      ) === reportId
    ) {
      setSelectedReport(null);
    }

    if (
      selectedTranscriptReport &&
      (
        selectedTranscriptReport.id ||
        selectedTranscriptReport.sessionId
      ) === reportId
    ) {
      setSelectedTranscriptReport(null);
    }
  };

  // =========================================================
  // DOWNLOAD REPORT
  //
  // IMPORTANT:
  // The main page/modal width is NOT changed.
  //
  // Only the cloned PDF version is changed to 190mm wide.
  //
  // A4 width  = 210mm
  // Left/right margins = 10mm each
  // PDF content width = 190mm
  // =========================================================

  const handleDownloadReport =
    async () => {

      if (
        !selectedReport ||
        !reportDownloadRef.current
      ) {
        return;
      }

      setDownloadingReport(true);

      try {

        const candidateName =
          selectedReport.candidateName ||
          selectedReport.candidate
            ?.fullName ||
          "Candidate";

        const element =
          reportDownloadRef.current;

        const options = {

          margin: [10, 10, 10, 10] as [number, number, number, number],

          filename:
            `IntelliHire-Interview-Report-${candidateName
              .replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )}.pdf`,

          image: {
            type: "jpeg" as const,
            quality: 0.98,
          },

          html2canvas: {

            scale: 2,

            useCORS: true,

            logging: false,

            backgroundColor:
              "#ffffff",

            // =================================================
            // PDF ONLY
            // =================================================
            //
            // Make the cloned report use the complete
            // available A4 content width.
            //
            // This DOES NOT change the actual modal on screen.
            // =================================================

            onclone: (
              clonedDocument: Document
            ) => {

              const clonedElement =
                clonedDocument.querySelector(
                  ".saved-report-modal-body"
                ) as HTMLElement | null;

              if (!clonedElement) {
                return;
              }

              // Remove screen/modal width restrictions
              clonedElement.style.width =
                "190mm";

              clonedElement.style.maxWidth =
                "none";

              clonedElement.style.minWidth =
                "190mm";

              clonedElement.style.margin =
                "0";

              clonedElement.style.boxSizing =
                "border-box";

              clonedElement.style.height =
                "auto";

              clonedElement.style.maxHeight =
                "none";

              clonedElement.style.overflow =
                "visible";

              clonedElement.style.overflowY =
                "visible";

              clonedElement.style.overflowX =
                "visible";

              // Make sure the PDF content itself
              // does not get constrained by flex/grid.
              clonedElement.style.flex =
                "none";

              // Prevent accidental transform scaling.
              clonedElement.style.transform =
                "none";
            },
          },

          jsPDF: {

            unit: "mm",

            format: "a4",

            orientation:
              "portrait" as const,
          },

          pagebreak: {

            mode: [
              "css",
              "legacy",
            ],
          },
        };

        await html2pdf()
          .set(options)
          .from(element)
          .save();

      } catch (error) {

        console.error(
          "Failed to download report:",
          error
        );

        alert(
          "Unable to download the report."
        );

      } finally {

        setDownloadingReport(false);
      }
    };

  // =========================================================
  // DOWNLOAD TRANSCRIPT
  //
  // PDF ONLY FULL WIDTH
  //
  // The transcript modal on the main page remains unchanged.
  // =========================================================

  const handleDownloadTranscript =
    async () => {

      if (
        !selectedTranscriptReport ||
        !transcriptDownloadRef.current
      ) {
        return;
      }

      setDownloadingTranscript(true);

      const element =
        transcriptDownloadRef.current;

      // Save original styles
      const originalMaxHeight =
        element.style.maxHeight;

      const originalHeight =
        element.style.height;

      const originalOverflow =
        element.style.overflow;

      const originalOverflowY =
        element.style.overflowY;

      const originalOverflowX =
        element.style.overflowX;

      const originalWidth =
        element.style.width;

      const originalMaxWidth =
        element.style.maxWidth;

      const originalMinWidth =
        element.style.minWidth;

      try {

        const candidateName =
          selectedTranscriptReport.candidateName ||
          selectedTranscriptReport.candidate
            ?.fullName ||
          "Candidate";

        // =====================================================
        // TEMPORARY SCREEN OVERRIDE
        //
        // These are restored after PDF generation.
        // =====================================================

        element.style.maxHeight =
          "none";

        element.style.height =
          "auto";

        element.style.overflow =
          "visible";

        element.style.overflowY =
          "visible";

        element.style.overflowX =
          "visible";

        // Do NOT permanently change the modal.
        // The cloned PDF will receive 190mm width below.

        // =====================================================
        // WAIT FOR BROWSER TO RENDER
        // =====================================================

        await new Promise<void>(
          (resolve) =>
            requestAnimationFrame(
              () =>
                requestAnimationFrame(
                  () => resolve()
                )
            )
        );

        // =====================================================
        // PDF OPTIONS
        // =====================================================

        const options = {

          margin: [10, 10, 10, 10] as [number, number, number, number],

          filename:
            `IntelliHire-Interview-Transcript-${candidateName
              .replace(
                /[^a-zA-Z0-9]/g,
                "_"
              )}.pdf`,

          image: {

            type: "jpeg" as const,

            quality: 0.98,
          },

          html2canvas: {

            scale: 2,

            useCORS: true,

            logging: false,

            backgroundColor:
              "#ffffff",

            // =================================================
            // PDF ONLY
            // =================================================

            onclone: (
              clonedDocument: Document
            ) => {

              const clonedElement =
                clonedDocument.querySelector(
                  ".saved-report-modal-body"
                ) as HTMLElement | null;

              if (!clonedElement) {
                return;
              }

              // Full A4 content width:
              // 210mm - 10mm left - 10mm right = 190mm

              clonedElement.style.width =
                "190mm";

              clonedElement.style.maxWidth =
                "none";

              clonedElement.style.minWidth =
                "190mm";

              clonedElement.style.margin =
                "0";

              clonedElement.style.boxSizing =
                "border-box";

              clonedElement.style.height =
                "auto";

              clonedElement.style.maxHeight =
                "none";

              clonedElement.style.overflow =
                "visible";

              clonedElement.style.overflowY =
                "visible";

              clonedElement.style.overflowX =
                "visible";

              clonedElement.style.flex =
                "none";

              clonedElement.style.transform =
                "none";

              // =================================================
              // Make transcript question blocks use
              // the full available PDF width.
              // =================================================

              const questionBlocks =
                clonedElement.querySelectorAll(
                  "[style*='breakInside']"
                );

              questionBlocks.forEach(
                (
                  block
                ) => {

                  const htmlBlock =
                    block as HTMLElement;

                  htmlBlock.style.width =
                    "100%";

                  htmlBlock.style.maxWidth =
                    "100%";

                  htmlBlock.style.boxSizing =
                    "border-box";
                }
              );
            },
          },

          jsPDF: {

            unit: "mm",

            format: "a4",

            orientation:
              "portrait" as const,
          },

          pagebreak: {

            mode: [
              "css",
              "legacy",
            ],
          },
        };

        // =====================================================
        // GENERATE PDF
        // =====================================================

        await html2pdf()
          .set(options)
          .from(element)
          .save();

      } catch (error) {

        console.error(
          "Failed to download transcript:",
          error
        );

        alert(
          "Unable to download the transcript."
        );

      } finally {

        // =====================================================
        // RESTORE ORIGINAL MODAL STYLES
        // =====================================================

        element.style.maxHeight =
          originalMaxHeight;

        element.style.height =
          originalHeight;

        element.style.overflow =
          originalOverflow;

        element.style.overflowY =
          originalOverflowY;

        element.style.overflowX =
          originalOverflowX;

        element.style.width =
          originalWidth;

        element.style.maxWidth =
          originalMaxWidth;

        element.style.minWidth =
          originalMinWidth;

        setDownloadingTranscript(false);
      }
    };

  // =========================================================
  // REPORT ROW
  // =========================================================

  const renderReportRow = (
    report: SavedReport,
    index: number
  ) => {

    const candidateName =
      report.candidateName ||
      report.candidate?.fullName ||
      "Candidate";

    const email =
      report.candidateEmail ||
      report.candidate?.email ||
      "Not provided";

    const role =
      report.role ||
      report.candidate?.currentRole ||
      "Not specified";

    const domain =
      report.domain ||
      "Not specified";

    const score =
      Number(
        report.overallScore
      );

    const date =
      formatDate(
        report.completedAt ||
        report.savedAt
      );

    return (

      <tr
        key={
          report.id ||
          report.sessionId ||
          index
        }
      >

        {/* CANDIDATE */}

        <td>

          <div className="saved-candidate">

            <div className="saved-candidate-avatar">

              {getInitials(
                candidateName
              )}

            </div>

            <div className="saved-candidate-info">

              <div className="saved-candidate-name">

                {candidateName}

              </div>

              <div className="saved-candidate-email">

                {email}

              </div>

            </div>

          </div>

        </td>

        {/* ROLE */}

        <td>

          <span className="saved-role">

            {role}

          </span>

        </td>

        {/* DOMAIN */}

        <td>

          <span className="saved-domain">

            {domain}

          </span>

        </td>

        {/* DATE */}

        <td>

          <div className="saved-date">

            <span className="saved-date-main">

              <CalendarDays
                size={13}
                style={{
                  marginRight: 5,
                  verticalAlign:
                    "middle",
                }}
              />

              {date.date}

            </span>

            <span className="saved-date-time">

              {date.time}

            </span>

          </div>

        </td>

        {/* SCORE */}

        <td>

          {Number.isNaN(
            score
          ) ? (

            <span className="saved-score needs-review">

              --

            </span>

          ) : (

            <span
              className={`saved-score ${getScoreClass(
                score
              )}`}
            >

              {score.toFixed(1)}
              /10

            </span>

          )}

        </td>

        {/* RECOMMENDATION */}

        <td>

          <span
            className={`saved-recommendation ${getRecommendationClass(
              report.recommendation
            )}`}
          >

            {report.recommendation ||
              "Pending"}

          </span>

        </td>

        {/* ACTIONS */}

        <td>

          <div className="saved-interview-actions">

            {/* VIEW REPORT */}

            <button
              type="button"
              className="saved-action-button"
              title="View report"
              onClick={() =>
                setSelectedReport(
                  report
                )
              }
            >

              <Eye size={16} />

            </button>

            {/* VIEW TRANSCRIPT */}

            <button
              type="button"
              className="saved-action-button"
              title={
                hasTranscript(report)
                  ? "View transcript"
                  : "Transcript unavailable"
              }
              disabled={
                !hasTranscript(report)
              }
              onClick={() =>
                setSelectedTranscriptReport(
                  report
                )
              }
            >

              <FileText size={16} />

            </button>

            {/* DELETE */}

            <button
              type="button"
              className="saved-action-button delete"
              title="Delete report"
              onClick={() =>
                handleDeleteReport(
                  report
                )
              }
            >

              <MoreVertical
                size={17}
              />

            </button>

          </div>

        </td>

      </tr>
    );
  };

  // =========================================================
  // JSX
  // =========================================================

  return (

    <div className="app">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="navbar-left">

          <div className="mirafra-logo">

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

        <nav className="navbar-center">

          <button
            className="nav-item active"
          >

            <span className="nav-icon home-nav-icon">
              <House size={21} strokeWidth={2.2} />
            </span>

            Home

          </button>

          <button
            className="nav-item"
            onClick={
              onNewInterview
            }
          >

            <span className="nav-icon">
              ＋
            </span>

            New Interview

          </button>

        </nav>

        <div className="navbar-right">

          <span className="notification-icon">
            ♧
          </span>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="home-content">

        {/* ===================================================
            WELCOME
        =================================================== */}

        <section className="welcome-section">

          <div className="welcome-content">

            <h1>

              Welcome to{" "}

              <span>
                IntelliHire
              </span>

            </h1>

            <p>
              Ready to conduct your next interview?
            </p>

            <button
              className="start-button"
              onClick={
                onNewInterview
              }
            >

              Start New Interview

            </button>

          </div>

          <div className="feature-cards">

            <div className="feature-card">

              <div className="feature-icon purple">
                <MessageCircle size={28} strokeWidth={2.5} />
              </div>

              <h2>

                AI Question
                <br />
                Generation

              </h2>

              <p>

                Generate role-based
                <br />
                questions instantly
                <br />
                with AI.

              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon blue">
                <ChartNoAxesCombined size={28} strokeWidth={2.2} />
              </div>

              <h2>

                Real-Time
                <br />
                Candidate Analysis

              </h2>

              <p>

                Analyze responses in
                <br />
                real-time and uncover
                <br />
                key insights.

              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon teal">
                <ClipboardCheck size={28} strokeWidth={2.2} />
              </div>

              <h2>

                Smart
                <br />
                Reports

              </h2>

              <p>

                Get detailed reports
                <br />
                and recommendations
                <br />
                instantly.

              </p>

            </div>

          </div>

        </section>

        {/* ===================================================
            SAVED REPORTS
        =================================================== */}

        <section className="saved-interviews-section">

          {/* HEADER */}

          <div className="saved-interviews-header">

            <div className="saved-interviews-title">

              <h2>
                Interview Reports
              </h2>

              <p>
                View and manage your completed interviews
              </p>

            </div>

            <div className="saved-interviews-controls">

              <input
                type="text"
                className="saved-interviews-search"
                placeholder="Search by candidate, role or domain..."
                value={
                  searchTerm
                }
                onChange={(e) =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />

              <button
                type="button"
                className="saved-page-button"
                onClick={
                  handleRefresh
                }
                title="Refresh reports"
              >

                <RefreshCw
                  size={15}
                />

              </button>

            </div>

          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="report-statistics">

            <div className="report-stat-card">

              <div className="report-stat-icon">

                <Users
                  size={22}
                />

              </div>

              <div>

                <span>
                  Interviews Conducted
                </span>

                <strong>
                  {
                    interviewsConducted
                  }
                </strong>

              </div>

            </div>

            <div className="report-stat-card">

              <div className="report-stat-icon">

                <ChartNoAxesCombined
                  size={22}
                />

              </div>

              <div>

                <span>
                  Average Score
                </span>

                <strong>

                  {averageScore !==
                  null
                    ? `${averageScore.toFixed(
                        1
                      )}/10`
                    : "--"}

                </strong>

              </div>

            </div>

            <div className="report-stat-card">

              <div className="report-stat-icon">

                <ClipboardCheck
                  size={22}
                />

              </div>

              <div>

                <span>
                  Total Candidates
                </span>

                <strong>
                  {
                    reports.length
                  }
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="saved-interviews-table-wrapper">

            {filteredReports.length ===
            0 ? (

              <div className="saved-interviews-empty">

                <div className="saved-interviews-empty-icon">

                  <FileText
                    size={23}
                  />

                </div>

                <h3>

                  {reports.length === 0
                    ? "No interview reports yet"
                    : "No matching interviews"}

                </h3>

                <p>

                  {reports.length === 0
                    ? "Complete an interview and click Save Report to see it here."
                    : "Try a different candidate, role or domain."}

                </p>

              </div>

            ) : (

              <table className="saved-interviews-table">

                <thead>

                  <tr>

                    <th>
                      Candidate
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Domain
                    </th>

                    <th>
                      Interview Date & Time
                    </th>

                    <th>
                      Score
                    </th>

                    <th>
                      Recommendation
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredReports.map(
                    renderReportRow
                  )}

                </tbody>

              </table>

            )}

          </div>

        </section>

      </main>

      {/* =====================================================
          REPORT MODAL
      ===================================================== */}

      {selectedReport && (

        <div className="saved-report-overlay">

          <div className="saved-report-modal">

            {/* HEADER */}

            <div className="saved-report-modal-header">

              <h2>
                Interview Report
              </h2>

              <div className="saved-report-header-actions">

                <button
                  type="button"
                  className="saved-report-download-button"
                  title={
                    downloadingReport
                      ? "Downloading..."
                      : "Download report"
                  }
                  aria-label="Download report"
                  onClick={
                    handleDownloadReport
                  }
                  disabled={
                    downloadingReport
                  }
                >

                  <Download
                    size={19}
                  />

                </button>

                <button
                  type="button"
                  className="saved-report-close"
                  title="Close report"
                  aria-label="Close report"
                  onClick={() =>
                    setSelectedReport(
                      null
                    )
                  }
                >

                  <X size={18} />

                </button>

              </div>

            </div>

            {/* REPORT BODY */}

            <div
              ref={
                reportDownloadRef
              }
              className="saved-report-modal-body"
            >
                        
{/* REPORT BRANDING */}

<div className="saved-report-pdf-header">

  <div className="saved-report-pdf-brand">
    <div className="saved-report-pdf-mirafra">
      mirafra
    </div>

    <div className="saved-report-pdf-technologies">
      TECHNOLOGIES
    </div>
  </div>

  <div className="saved-report-pdf-heading">
    <h1>
      IntelliHire - Interview Report
    </h1>
  </div>

</div>

              {/* CANDIDATE DETAILS */}

              <div className="saved-report-detail-grid">

                <div className="saved-report-detail">

                  <span>
                    Candidate
                  </span>

                  <strong>

                    {
                      selectedReport.candidateName ||
                      selectedReport.candidate
                        ?.fullName ||
                      "Candidate"
                    }

                  </strong>

                </div>

                <div className="saved-report-detail">

                  <span>
                    Role
                  </span>

                  <strong>

                    {
                      selectedReport.role ||
                      "Not specified"
                    }

                  </strong>

                </div>

                <div className="saved-report-detail">

                  <span>
                    Domain
                  </span>

                  <strong>

                    {
                      selectedReport.domain ||
                      "Not specified"
                    }

                  </strong>

                </div>

                <div className="saved-report-detail">

                  <span>
                    Experience
                  </span>

                  <strong>

                    {
                      selectedReport.experience ||
                      selectedReport
                        .candidate
                        ?.experience ||
                      "Not specified"
                    }

                  </strong>

                </div>

                <div className="saved-report-detail">

                  <span>
                    Score
                  </span>

                  <strong>

                    {
                      selectedReport.overallScore !==
                      undefined &&
                      selectedReport.overallScore !==
                        null
                        ? `${Number(
                            selectedReport.overallScore
                          ).toFixed(
                            1
                          )}/10`
                        : "--"
                    }

                  </strong>

                </div>

                <div className="saved-report-detail">

                  <span>
                    Recommendation
                  </span>

                  <strong>

                    {
                      selectedReport.recommendation ||
                      "Pending"
                    }

                  </strong>

                </div>

              </div>

              {/* SUMMARY */}

              <div className="saved-report-content-section">

                <h3>
                  Summary
                </h3>

                <p>

                  {
                    selectedReport.summary ||
                    "No summary available."
                  }

                </p>

              </div>

              {/* STRENGTHS / IMPROVEMENTS */}

              <div className="saved-report-two-column">

                <div className="saved-report-content-section">

                  <h3>
                    Strengths
                  </h3>

                  {selectedReport
                    .strengths
                    ?.length ? (

                    <ul className="saved-report-list">

                      {selectedReport.strengths.map(
                        (
                          strength,
                          index
                        ) => (

                          <li
                            key={
                              index
                            }
                          >

                            {
                              strength
                            }

                          </li>

                        )
                      )}

                    </ul>

                  ) : (

                    <p>
                      No strengths observed.
                    </p>

                  )}

                </div>

                <div className="saved-report-content-section">

                  <h3>
                    Areas of Improvement
                  </h3>

                  {selectedReport
                    .weaknesses
                    ?.length ? (

                    <ul className="saved-report-list">

                      {selectedReport.weaknesses.map(
                        (
                          weakness,
                          index
                        ) => (

                          <li
                            key={
                              index
                            }
                          >

                            {
                              weakness
                            }

                          </li>

                        )
                      )}

                    </ul>

                  ) : (

                    <p>
                      No areas of improvement observed.
                    </p>

                  )}

                </div>

              </div>

              {/* FEEDBACK */}

              <div className="saved-report-content-section">

                <h3>
                  Interviewer Feedback
                </h3>

                <p>

                  {
                    selectedReport.feedback ||
                    "No interviewer feedback available."
                  }

                </p>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          TRANSCRIPT MODAL
      ===================================================== */}

      {selectedTranscriptReport && (

        <div className="saved-report-overlay">

          <div className="saved-report-modal transcript-modal">

            {/* =================================================
                TRANSCRIPT HEADER
            ================================================= */}

            <div className="saved-report-modal-header">

              <div>

                <h2>
                  Interview Transcript
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    fontSize:
                      "16px",
                    color:
                      "#64748b",
                  }}
                >

                  {
                    selectedTranscriptReport
                      .candidateName ||
                    selectedTranscriptReport
                      .candidate
                      ?.fullName ||
                    "Candidate"
                  }

                </p>

              </div>

              {/* =================================================
                  TRANSCRIPT ACTIONS
              ================================================= */}

              <div className="saved-report-header-actions">

                {/* DOWNLOAD TRANSCRIPT */}

                <button
                  type="button"
                  className="saved-report-download-button"
                  title={
                    downloadingTranscript
                      ? "Downloading transcript..."
                      : "Download transcript"
                  }
                  aria-label="Download transcript"
                  onClick={
                    handleDownloadTranscript
                  }
                  disabled={
                    downloadingTranscript
                  }
                >

                  <Download
                    size={19}
                  />

                </button>

                {/* CLOSE */}

                <button
                  type="button"
                  className="saved-report-close"
                  title="Close transcript"
                  aria-label="Close transcript"
                  onClick={() =>
                    setSelectedTranscriptReport(
                      null
                    )
                  }
                >

                  <X size={18} />

                </button>

              </div>

            </div>

            {/* =================================================
                TRANSCRIPT BODY
            ================================================= */}

            <div
              ref={
                transcriptDownloadRef
              }
              className="saved-report-modal-body"
              style={{
                maxHeight:
                  "70vh",
                overflowY:
                  "auto",
              }}
            >
{/* =================================================
    TRANSCRIPT PDF BRANDING
================================================= */}

<div className="saved-report-pdf-header">

  <div className="saved-report-pdf-brand">

    <div className="saved-report-pdf-mirafra">
      mirafra
    </div>

    <div className="saved-report-pdf-technologies">
      TECHNOLOGIES
    </div>

  </div>

  <div className="saved-report-pdf-heading">

    <h1>
      IntelliHire - Interview Transcript
    </h1>

  </div>

</div>

{/* CANDIDATE INFORMATION */}

<div
  style={{
    marginBottom: "22px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e2e8f0",
  }}
>

  <div
    style={{
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "5px",
    }}
  >
    Candidate
  </div>

  <div
    style={{
      fontSize: "18px",
      fontWeight: 700,
      color: "#1e293b",
    }}
  >
    {
      selectedTranscriptReport.candidateName ||
      selectedTranscriptReport.candidate?.fullName ||
      "Candidate"
    }
  </div>

</div>
              {selectedTranscriptReport
                .answers
                ?.length ? (

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "18px",
                  }}
                >

                  {selectedTranscriptReport.answers.map(
                    (
                      item,
                      index
                    ) => {

                      const transcript =
                        item.transcript ||
                        item.answer ||
                        "";

                      return (

                        <div
                          key={
                            index
                          }
                          style={{
                            border:
                              "1px solid #e2e8f0",
                            borderRadius:
                              "10px",
                            padding:
                              "18px",
                            background:
                              "#ffffff",

                            breakInside:
                              "avoid",
                            pageBreakInside:
                              "avoid",
                          }}
                        >

                          {/* QUESTION NUMBER */}

                          <div
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              marginBottom:
                                "10px",
                            }}
                          >

                            <span
                              style={{
                                fontSize:
                                  "16px",
                                fontWeight:
                                  700,
                                color:
                                  "#64748b",
                                textTransform:
                                  "uppercase",
                              }}
                            >

                              {item.isFollowup
                                ? "Follow-up Question"
                                : `Question ${
                                    item.questionNumber ||
                                    index +
                                      1
                                  }`}

                            </span>

                            {item.score !==
                              undefined &&
                              item.score !==
                                null && (

                              <span
                                style={{
                                  fontSize:
                                    "16px",
                                  fontWeight:
                                    700,
                                  color:
                                    "#475569",
                                }}
                              >

                                Score:{" "}

                                {
                                  item.score
                                }

                                /10

                              </span>

                            )}

                          </div>

                          {/* QUESTION */}

                          <div
                            style={{
                              marginBottom:
                                "14px",
                            }}
                          >

                            <div
                              style={{
                                fontSize:
                                  "16px",
                                fontWeight:
                                  600,
                                color:
                                  "#64748b",
                                marginBottom:
                                  "5px",
                              }}
                            >

                              Question

                            </div>

                            <div
                              style={{
                                fontSize:
                                  "16px",
                                fontWeight:
                                  600,
                                lineHeight:
                                  1.5,
                                color:
                                  "#1e293b",
                              }}
                            >

                              {
                                item.question ||
                                "Question not available."
                              }

                            </div>

                          </div>

                          {/* CANDIDATE TRANSCRIPT */}

                          <div>

                            <div
                              style={{
                                fontSize:
                                  "16px",
                                fontWeight:
                                  600,
                                color:
                                  "#64748b",
                                marginBottom:
                                  "5px",
                              }}
                            >

                              Candidate Transcript

                            </div>

                            <div
                              style={{
                                padding:
                                  "13px 14px",
                                borderRadius:
                                  "8px",
                                background:
                                  "#f8fafc",
                                border:
                                  "1px solid #e2e8f0",
                                fontSize:
                                  "16px",
                                lineHeight:
                                  1.6,
                                color:
                                  "#334155",
                                whiteSpace:
                                  "pre-wrap",
                              }}
                            >

                              {transcript ||
                                "No transcript available."}

                            </div>

                          </div>

                          {/* FEEDBACK */}

                          {item.feedback && (

                            <div
                              style={{
                                marginTop:
                                  "12px",
                              }}
                            >

                              <div
                                style={{
                                  fontSize:
                                    "16px",
                                  fontWeight:
                                    600,
                                  color:
                                    "#64748b",
                                  marginBottom:
                                    "5px",
                                }}
                              >

                                Feedback

                              </div>

                              <div
                                style={{
                                  fontSize:
                                    "16px",
                                  lineHeight:
                                    1.5,
                                  color:
                                    "#475569",
                                }}
                              >

                                {
                                  item.feedback
                                }

                              </div>

                            </div>

                          )}

                        </div>

                      );
                    }
                  )}

                </div>

              ) : (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "50px 20px",
                    color:
                      "#64748b",
                  }}
                >

                  <FileText
                    size={40}
                    style={{
                      marginBottom:
                        "12px",
                      opacity:
                        0.5,
                    }}
                  />

                  <h3
                    style={{
                      margin:
                        "0 0 8px",
                      color:
                        "#334155",
                    }}
                  >

                    No transcript available

                  </h3>

                  <p
                    style={{
                      margin:
                        0,
                      fontSize:
                        "16px",
                    }}
                  >

                    This interview report does not contain
                    any saved transcript data.

                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Home;