import { useState } from "react";
 
import Login from "./components/Login";

import Home from "./components/Home";

import NewInterview from "./components/NewInterview";

import ReviewStart from "./components/ReviewStart";

import LiveInterview from "./components/LiveInterview";

import InterviewReport from "./components/InterviewReport";
 
function App() {

  const [currentPage, setCurrentPage] = useState(1);
 
  /* =====================================================

     CANDIDATE DATA

  ===================================================== */
 
  const [candidate, setCandidate] = useState({

    fullName: "",

    email: "",

    phone: "",

    experience: "",

    currentRole: "",

    currentCompany: "",

    skills: "",

    summary: "",

  });
 
  /* =====================================================

     ADDITIONAL INTERVIEW DATA

  ===================================================== */
 
  const [formData, setFormData] = useState({

    role: "",

    domain: "",

    managerEmail: "",

    domainExperience: "",

  });
 
  /* =====================================================

     LOGIN → HOME

  ===================================================== */
 
  const goToHome = () => {

    setCurrentPage(2);

  };
 
  /* =====================================================

     HOME → LOGIN

  ===================================================== */
 
  const goToLogin = () => {

    setCurrentPage(1);

  };
 
  /* =====================================================

     HOME → NEW INTERVIEW

  ===================================================== */
 
  const goToNewInterview = () => {

    setCurrentPage(3);

  };
 
  /* =====================================================

     NEW INTERVIEW → HOME

  ===================================================== */
 
  const goToHomeFromNewInterview = () => {

    setCurrentPage(2);

  };
 
  /* =====================================================

     NEW INTERVIEW → REVIEW & START

  ===================================================== */
 
  const goToReviewStart = () => {

    setCurrentPage(4);

  };
 
  /* =====================================================

     REVIEW & START → NEW INTERVIEW

  ===================================================== */
 
  const goToNewInterviewFromReview = () => {

    setCurrentPage(3);

  };
 
  /* =====================================================

     START INTERVIEW

  ===================================================== */
 
  const startInterview = () => {

    console.log("Starting interview...");

    setCurrentPage(5);

  };
 
  /* =====================================================

     INTERVIEW → REPORT

  ===================================================== */
 
  const openInterviewReport = () => {

    console.log("Opening Interview Report...");

    setCurrentPage(6);

  };
 
  /* =====================================================

     REPORT → HOME

  ===================================================== */
 
  const closeInterviewReport = () => {

    setCurrentPage(2);

  };
 
  return (
<div className="app">
 
      {/* =====================================================

          PAGE 1 - LOGIN

      ===================================================== */}
 
      {currentPage === 1 && (
<Login

          onLogin={goToHome}

        />

      )}
 
      {/* =====================================================

          PAGE 2 - HOME

      ===================================================== */}
 
      {currentPage === 2 && (
<Home

          onLogout={goToLogin}

          onNewInterview={goToNewInterview}

        />

      )}
 
      {/* =====================================================

          PAGE 3 - NEW INTERVIEW

      ===================================================== */}
 
      <div

        style={{

          display: currentPage === 3 ? "block" : "none",

        }}
>
<NewInterview

          onBack={goToHomeFromNewInterview}

          onHome={goToHomeFromNewInterview}

          onReviewStart={goToReviewStart}
 
          candidate={candidate}

          setCandidate={setCandidate}
 
          formData={formData}

          setFormData={setFormData}

        />
</div>
 
      {/* =====================================================

          PAGE 4 - REVIEW & START

      ===================================================== */}
 
      {currentPage === 4 && (
<ReviewStart

          onBack={goToNewInterviewFromReview}

          onHome={goToHomeFromNewInterview}

          onStartInterview={startInterview}
 
          candidate={candidate}

          formData={formData}

        />

      )}
 
      {/* =====================================================

          PAGE 5 - LIVE INTERVIEW

      ===================================================== */}
 
      {currentPage === 5 && (
<LiveInterview

          onComplete={openInterviewReport}

        />

      )}
 
      {/* =====================================================

          PAGE 6 - INTERVIEW REPORT

      ===================================================== */}
 
      {currentPage === 6 && (
<InterviewReport

          candidate={candidate}

          formData={formData}

          onClose={closeInterviewReport}

        />

      )}
 
    </div>

  );

}
 
export default App;
 