import "../index.css";

function Login({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="login-page">

      {/* ================= LEFT SIDE ================= */}
      <section className="login-left">

        {/* Mirafra Logo */}
        <div className="brand">
          <div className="mirafra-logo">mirafra</div>
          <div className="technologies">TECHNOLOGIES</div>
        </div>

        {/* Main Left Content */}
        <div className="left-content">

          <h1>
            Intelli<span>Hire</span>
          </h1>

          <h2>AI Interviewer Assistant</h2>

          <div className="green-line"></div>

          <p className="description">
            Your intelligent companion for conducting
            structured, unbiased and insight-driven
            interviews.
          </p>

          {/* Feature 1 */}
          <div className="feature">

            <div className="feature-icon">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="9" cy="8" r="3" />
                <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <circle cx="18" cy="8" r="2" />
                <path d="M16 14c2.2.5 4 2.4 4 5" />
                <path d="M18 4v8" />
                <path d="M15 7h6" />
              </svg>
            </div>

            <div className="feature-content">
              <h3>AI-Powered Interviews</h3>
              <p>
                Smart question generation and
                real-time analysis
              </p>
            </div>

          </div>


          {/* Feature 2 */}
          <div className="feature">

            <div className="feature-icon">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 20V10" />
                <path d="M10 20V4" />
                <path d="M16 20v-7" />
                <path d="M22 20H2" />
              </svg>
            </div>

            <div className="feature-content">
              <h3>Insightful Reports</h3>
              <p>
                Comprehensive evaluation
                and feedback
              </p>
            </div>

          </div>


          {/* Feature 3 */}
          <div className="feature">

            <div className="feature-icon">
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
                <rect
                  x="9"
                  y="10"
                  width="6"
                  height="6"
                  rx="1"
                />
                <path d="M10 10V8a2 2 0 014 0v2" />
              </svg>
            </div>

            <div className="feature-content">
              <h3>Secure &amp; Confidential</h3>
              <p>
                Enterprise-grade security for
                your data
              </p>
            </div>

          </div>

        </div>

        {/* Decorative bottom shape */}
        <div className="bottom-wave"></div>

      </section>


      {/* ================= RIGHT SIDE ================= */}
      <section className="login-right">

        <div className="login-card">

          {/* User Icon */}
          {/* User Icon */}
            <div className="user-icon">
              <svg
                width="42"
                height="42"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M5 20c0-3.8 3.1-7 7-7s7 3.2 7 7" />
              </svg>
            </div>

          {/* Microsoft Button */}
          <button className="microsoft-button" onClick={onLogin}>

            <div className="microsoft-logo">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span>Sign in with Microsoft</span>

          </button>


          {/* Security */}
          <div className="security-message">

            <div className="lock-icon">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                />
                <path d="M8 10V7a4 4 0 018 0v3" />
                <circle cx="12" cy="15" r="1" />
                <path d="M12 16v2" />
              </svg>
            </div>

            <p>
              Use your Mirafra work account to access
              this application securely.
            </p>

          </div>

        </div>


        {/* Support */}
        <div className="support">
          Need help? &nbsp;
          <span>Contact IT Support</span>
        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="login-footer">
        © 2026&nbsp; Mirafra Software Technologies Pvt Ltd
        &nbsp;&nbsp;|&nbsp;&nbsp; Internal Application
      </footer>

    </div>
  );
}

export default Login;