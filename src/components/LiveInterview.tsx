import React, {
  useEffect,
  useRef,
  useState,
} from "react";

interface LiveInterviewProps {
  onComplete?: () => void;
}

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

interface SampleQuestion {
  id?: number;
  domain?: string;
  difficulty?: string;
  experienceMin?: number;
  experienceMax?: number;
  question: string;
}

interface InterviewSettings {
  numberOfQuestions?: number;
}

interface InterviewData {
  candidate?: CandidateData;
  formData?: FormData;
  sessionId?: string;
  interviewSettings?: InterviewSettings;
  sampleQuestions?: SampleQuestion[];
  question?: string;
  numberOfQuestions?: number;
}

interface AnswerResult {
  success?: boolean;
  action?: "next" | "followup" | "complete";
  score?: number;
  feedback?: string;
  next_question?: string;
  followup_question?: string;
  question_number?: number;
  total_questions?: number;
  message?: string;
}

/* =========================================================
   TRANSCRIPT RESPONSE
   ========================================================= */

interface TranscriptResponse {
  success?: boolean;
  running?: boolean;
  transcript?: string;
  final_transcript?: string;
  error?: string;
}

/* =========================================================
   STORED INTERVIEW ANSWER
   ========================================================= */

interface InterviewAnswer {
  questionNumber: number;
  question: string;
  answer: string;
  score: number | null;
  feedback: string;
  isFollowup: boolean;
}

/* =========================================================
   STORED REPORT DATA
   ========================================================= */

interface InterviewReportData {
  sessionId?: string;

  candidate?: CandidateData;

  role?: string;

  domain?: string;

  experience?: string;

  totalQuestions: number;

  answers: InterviewAnswer[];

  completedAt?: string;
}

/* =========================================================
   API
   ========================================================= */

const API_BASE_URL =
  "http://127.0.0.1:8000";

/* =========================================================
   SESSION STORAGE KEY
   ========================================================= */

const REPORT_STORAGE_KEY =
  "intellihire_interview_report";

/* =========================================================
   COMPONENT
   ========================================================= */

const LiveInterview: React.FC<LiveInterviewProps> = ({
  onComplete,
}) => {
  // =========================================================
  // INTERVIEW DATA
  // =========================================================

  const [interviewData, setInterviewData] =
    useState<InterviewData | null>(null);

  const interviewDataRef =
    useRef<InterviewData | null>(null);

  // =========================================================
  // QUESTION
  // =========================================================

  const [question, setQuestion] =
    useState("");

  const questionRef =
    useRef("");

  const [questionNumber, setQuestionNumber] =
    useState(1);

  const questionNumberRef =
    useRef(1);

  const [totalQuestions, setTotalQuestions] =
    useState(10);

  // =========================================================
  // FOLLOW UP
  // =========================================================

  const [isFollowup, setIsFollowup] =
    useState(false);

  const isFollowupRef =
    useRef(false);

  // =========================================================
  // CANDIDATE TRANSCRIPT
  // =========================================================

  const [transcript, setTranscript] =
    useState("");

  const transcriptRef =
    useRef("");

  // =========================================================
  // AUDIO STATUS
  // =========================================================

  const [isListening, setIsListening] =
    useState(false);

  const [audioStatus, setAudioStatus] =
    useState("Starting candidate audio...");

  const audioStartedRef =
    useRef(false);

  const audioStartingRef =
    useRef(false);

  // =========================================================
  // TRANSCRIPT POLLING
  // =========================================================

  const transcriptTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  // =========================================================
  // COMPONENT / INTERVIEW LIFECYCLE
  // =========================================================

  const componentMountedRef =
    useRef(false);

  const interviewEndedRef =
    useRef(false);

  // =========================================================
  // EARLY ENDING
  // =========================================================

  /*
   * This ref is different from interviewEndedRef.
   *
   * interviewEndedRef:
   *   Prevents audio/transcript activity after the interview
   *   has ended.
   *
   * endingInterviewRef:
   *   Tells submitAnswer that the candidate explicitly clicked
   *   End Interview and that the current answer should be
   *   evaluated, stored, and then the interview should finish.
   */

  const endingInterviewRef =
    useRef(false);

  // =========================================================
  // INTERVIEW COMPLETION
  // =========================================================

  const [interviewCompleted, setInterviewCompleted] =
    useState(false);

  // =========================================================
  // EVALUATION
  // =========================================================

  const [score, setScore] =
    useState<number | null>(null);

  const [, setFeedback] = useState("");

  const [isEvaluating, setIsEvaluating] =
    useState(false);

  const processingAnswerRef =
    useRef(false);

  // =========================================================
  // LOAD / INITIALIZE INTERVIEW DATA
  // =========================================================

  useEffect(() => {
    const saved =
      sessionStorage.getItem(
        "intellihire_interview_data"
      );

    if (!saved) {
      console.error(
        "No interview data found."
      );

      setAudioStatus(
        "Interview data not found."
      );

      return;
    }

    try {
      const parsed: InterviewData =
        JSON.parse(saved);

      console.log(
        "Live Interview Data:",
        parsed
      );

      setInterviewData(parsed);

      interviewDataRef.current =
        parsed;

      // -------------------------------------------------------
      // TOTAL QUESTIONS
      // -------------------------------------------------------

      const configuredQuestionCount =
        parsed.interviewSettings
          ?.numberOfQuestions ||
        parsed.numberOfQuestions ||
        parsed.sampleQuestions?.length ||
        10;

      setTotalQuestions(
        configuredQuestionCount
      );

      // -------------------------------------------------------
      // INITIALIZE REPORT STORAGE
      // -------------------------------------------------------

      const existingReport =
        sessionStorage.getItem(
          REPORT_STORAGE_KEY
        );

      let shouldCreateNewReport = true;

      if (existingReport) {
        try {
          const existingData:
            InterviewReportData =
            JSON.parse(existingReport);

          /*
           * If the same interview session already exists,
           * keep the existing answers.
           *
           * This prevents accidental deletion if the
           * component gets mounted again.
           */

          if (
            existingData.sessionId &&
            parsed.sessionId &&
            existingData.sessionId ===
              parsed.sessionId
          ) {
            shouldCreateNewReport = false;
          }
        } catch (error) {
          console.warn(
            "Existing report data could not be parsed.",
            error
          );
        }
      }

      if (shouldCreateNewReport) {
        const initialReport:
          InterviewReportData = {
          sessionId:
            parsed.sessionId,

          candidate:
            parsed.candidate,

          role:
            parsed.formData?.role ||
            parsed.candidate?.currentRole ||
            "",

          domain:
            parsed.formData?.domain ||
            "",

          experience:
            parsed.formData?.domainExperience ||
            parsed.candidate?.experience ||
            "",

          totalQuestions:
            configuredQuestionCount,

          answers: [],

          completedAt: undefined,
        };

        sessionStorage.setItem(
          REPORT_STORAGE_KEY,
          JSON.stringify(initialReport)
        );

        console.log(
          "New interview report storage initialized."
        );
      }

      // -------------------------------------------------------
      // FIRST QUESTION
      // -------------------------------------------------------

      const generatedQuestions =
        parsed.sampleQuestions || [];

      if (
        generatedQuestions.length > 0 &&
        generatedQuestions[0]?.question
      ) {
        const firstQuestion =
          generatedQuestions[0].question;

        setQuestion(
          firstQuestion
        );

        questionRef.current =
          firstQuestion;

        questionNumberRef.current =
          1;

        setQuestionNumber(1);

      } else if (parsed.question) {

        setQuestion(
          parsed.question
        );

        questionRef.current =
          parsed.question;

      } else {

        setAudioStatus(
          "No interview questions available."
        );
      }

    } catch (error) {

      console.error(
        "Failed to parse interview data:",
        error
      );

      setAudioStatus(
        "Unable to load interview."
      );
    }
  }, []);

  // =========================================================
  // STORE ANSWER IN SESSION STORAGE
  // =========================================================

  const storeInterviewAnswer = (
    answerData: InterviewAnswer
  ) => {
    try {
      const stored =
        sessionStorage.getItem(
          REPORT_STORAGE_KEY
        );

      let reportData:
        InterviewReportData;

      if (stored) {
        reportData =
          JSON.parse(stored);
      } else {
        const data =
          interviewDataRef.current;

        reportData = {
          sessionId:
            data?.sessionId,

          candidate:
            data?.candidate,

          role:
            data?.formData?.role ||
            data?.candidate?.currentRole ||
            "",

          domain:
            data?.formData?.domain ||
            "",

          experience:
            data?.formData?.domainExperience ||
            data?.candidate?.experience ||
            "",

          totalQuestions,

          answers: [],
        };
      }

      /*
       * Add the new answer.
       *
       * We use question + question number +
       * follow-up status to avoid accidentally
       * storing the exact same answer twice.
       */

      const alreadyStored =
        reportData.answers.some(
          (existingAnswer) =>
            existingAnswer.questionNumber ===
              answerData.questionNumber &&
            existingAnswer.question ===
              answerData.question &&
            existingAnswer.answer ===
              answerData.answer &&
            existingAnswer.isFollowup ===
              answerData.isFollowup
        );

      if (!alreadyStored) {
        reportData.answers.push(
          answerData
        );
      }

      reportData.totalQuestions =
        totalQuestions;

      sessionStorage.setItem(
        REPORT_STORAGE_KEY,
        JSON.stringify(reportData)
      );

      console.log(
        "Interview answer stored:",
        answerData
      );

      console.log(
        "Complete interview report data:",
        reportData
      );

    } catch (error) {

      console.error(
        "Failed to store interview answer:",
        error
      );
    }
  };

  // =========================================================
  // START BACKEND AUDIO
  // =========================================================

  const startAudioService =
    async () => {

      if (audioStartedRef.current) {

        console.log(
          "Audio service already running."
        );

        return true;
      }

      if (audioStartingRef.current) {

        console.log(
          "Audio service start already in progress."
        );

        return false;
      }

      if (interviewEndedRef.current) {
        return false;
      }

      audioStartingRef.current =
        true;

      try {

        setAudioStatus(
          "Starting candidate audio..."
        );

        console.log(
          "Starting backend audio service..."
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/audio/start`,
            {
              method: "POST",
            }
          );

        if (!response.ok) {

          const errorText =
            await response.text();

          throw new Error(
            errorText ||
            `Audio start failed: ${response.status}`
          );
        }

        const result =
          await response.json();

        console.log(
          "Audio service started:",
          result
        );

        if (!result.success) {

          throw new Error(
            result.message ||
            "Audio service failed to start."
          );
        }

        audioStartedRef.current =
          true;

        setIsListening(true);

        setAudioStatus(
          "Listening to candidate..."
        );

        return true;

      } catch (error) {

        console.error(
          "Audio service error:",
          error
        );

        audioStartedRef.current =
          false;

        setIsListening(false);

        setAudioStatus(
          error instanceof Error
            ? error.message
            : "Unable to start audio service."
        );

        return false;

      } finally {

        audioStartingRef.current =
          false;
      }
    };

  // =========================================================
  // STOP BACKEND AUDIO
  // =========================================================

  const stopAudioService =
    async () => {

      if (!audioStartedRef.current) {

        setIsListening(false);

        return;
      }

      console.log(
        "Stopping candidate audio..."
      );

      audioStartedRef.current =
        false;

      setIsListening(false);

      try {

        await fetch(
          `${API_BASE_URL}/api/audio/stop`,
          {
            method: "POST",
          }
        );

      } catch (error) {

        console.error(
          "Failed to stop audio service:",
          error
        );
      }
    };

  // =========================================================
  // START TRANSCRIPT POLLING
  // =========================================================

  const startTranscriptPolling =
    () => {

      if (
        transcriptTimerRef.current !== null
      ) {

        console.log(
          "Transcript polling already running."
        );

        return;
      }

      console.log(
        "Starting transcript polling..."
      );

      transcriptTimerRef.current =
        setInterval(
          () => {
            fetchTranscript();
          },
          500
        );
    };

  // =========================================================
  // STOP TRANSCRIPT POLLING
  // =========================================================

  const stopTranscriptPolling =
    () => {

      if (
        transcriptTimerRef.current !== null
      ) {

        console.log(
          "Stopping transcript polling..."
        );

        clearInterval(
          transcriptTimerRef.current
        );

        transcriptTimerRef.current =
          null;
      }
    };

  // =========================================================
  // GET CANDIDATE TRANSCRIPT
  // =========================================================

  const fetchTranscript =
    async () => {

      if (
        !audioStartedRef.current ||
        interviewEndedRef.current
      ) {

        return;
      }

      try {

        const response =
          await fetch(
            `${API_BASE_URL}/api/audio/transcript`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        if (!response.ok) {

          console.error(
            "Transcript request failed:",
            response.status
          );

          return;
        }

        const result: TranscriptResponse =
          await response.json();

        // -----------------------------------------------------
        // AUDIO SERVICE ERROR
        // -----------------------------------------------------

        if (result.error) {

          console.error(
            "Audio service error:",
            result.error
          );

          setAudioStatus(
            result.error
          );

          return;
        }

        // -----------------------------------------------------
        // CURRENT TRANSCRIPT
        // -----------------------------------------------------

        const text =
          result.transcript ||
          result.final_transcript ||
          "";

        // -----------------------------------------------------
        // UPDATE ANSWER BOX
        // -----------------------------------------------------

        if (text.trim()) {

          transcriptRef.current =
            text;

          setTranscript(
            text
          );
        }

        // -----------------------------------------------------
        // AUDIO STATUS
        // -----------------------------------------------------

        if (result.running) {

          if (!isEvaluating) {

            setIsListening(true);

            setAudioStatus(
              "Listening to candidate..."
            );
          }

        } else {

          setIsListening(false);

          if (
            audioStartedRef.current &&
            !interviewEndedRef.current
          ) {

            console.warn(
              "Backend audio service stopped unexpectedly."
            );

            setAudioStatus(
              "Audio service stopped."
            );
          }
        }

      } catch (error) {

        console.error(
          "Transcript polling error:",
          error
        );
      }
    };

  // =========================================================
  // INITIALIZE INTERVIEW AUDIO
  // =========================================================

  useEffect(() => {

    componentMountedRef.current =
      true;

    interviewEndedRef.current =
      false;

    const initializeAudio =
      async () => {

        console.log(
          "Initializing interview audio..."
        );

        const started =
          await startAudioService();

        if (
          !componentMountedRef.current
        ) {

          return;
        }

        if (!started) {

          return;
        }

        await fetchTranscript();

        if (
          componentMountedRef.current &&
          !interviewEndedRef.current
        ) {

          startTranscriptPolling();
        }
      };

    initializeAudio();

    return () => {

      console.log(
        "LiveInterview cleanup..."
      );

      componentMountedRef.current =
        false;

      interviewEndedRef.current =
        true;

      stopTranscriptPolling();

      stopAudioService();
    };

  }, []);

  // =========================================================
  // FINALIZE INTERVIEW
  // =========================================================

  /*
   * This function is responsible only for finishing the
   * interview AFTER all required answers have already been
   * stored/evaluated.
   *
   * It does not create or evaluate unanswered questions.
   */

  const finalizeInterview =
    async () => {

      console.log(
        "Finalizing interview..."
      );

      // -------------------------------------------------------
      // STOP TRANSCRIPT POLLING
      // -------------------------------------------------------

      stopTranscriptPolling();

      // -------------------------------------------------------
      // STOP AUDIO
      // -------------------------------------------------------

      await stopAudioService();

      // -------------------------------------------------------
      // MARK REPORT AS COMPLETED
      // -------------------------------------------------------

      try {

        const stored =
          sessionStorage.getItem(
            REPORT_STORAGE_KEY
          );

        if (stored) {

          const reportData:
            InterviewReportData =
            JSON.parse(stored);

          reportData.completedAt =
            new Date().toISOString();

          sessionStorage.setItem(
            REPORT_STORAGE_KEY,
            JSON.stringify(reportData)
          );

          console.log(
            "Final interview report data:",
            reportData
          );
        }

      } catch (error) {

        console.error(
          "Failed to finalize report data:",
          error
        );
      }

      setInterviewCompleted(
        true
      );

      setIsEvaluating(
        false
      );

      setAudioStatus(
        "Interview ended."
      );

      endingInterviewRef.current =
        false;

      // -------------------------------------------------------
      // OPEN REPORT
      // -------------------------------------------------------

      if (onComplete) {
        onComplete();
      }
    };

  // =========================================================
  // SUBMIT ANSWER
  // =========================================================

  const submitAnswer =
    async (
      finalAnswer: string
    ) => {

      if (!finalAnswer.trim()) {

        setAudioStatus(
          "No answer detected."
        );

        return;
      }

      if (
        processingAnswerRef.current
      ) {

        return;
      }

      const data =
        interviewDataRef.current;

      if (!data) {

        setAudioStatus(
          "Interview data is unavailable."
        );

        return;
      }

      processingAnswerRef.current =
        true;

      setIsEvaluating(true);

      /*
       * Keep evaluation processing fast and neutral.
       */

      setAudioStatus(
        "Processing response..."
      );

      // -------------------------------------------------------
      // STOP TRANSCRIPT POLLING
      // -------------------------------------------------------

      stopTranscriptPolling();

      // -------------------------------------------------------
      // STOP AUDIO WHILE EVALUATING
      // -------------------------------------------------------

      await stopAudioService();

      try {

        const currentQuestionNumber =
          questionNumberRef.current;

        const currentQuestion =
          questionRef.current;

        /*
         * IMPORTANT:
         * Capture the follow-up state BEFORE changing it.
         *
         * This ensures the backend knows whether the answer
         * belongs to the main question or its follow-up.
         */

        const currentIsFollowup =
          isFollowupRef.current;

        const sessionId =
          data.sessionId;

        const domain =
          data.formData?.domain ||
          "";

        const domainExperience =
          data.formData?.domainExperience ||
          "";

        const role =
          data.formData?.role ||
          "";

        const referenceQuestions =
          data.sampleQuestions ||
          [];

        // =====================================================
        // SEND ANSWER TO BACKEND
        // =====================================================

        const response =
          await fetch(
            `${API_BASE_URL}/api/process-answer`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({

                session_id:
                  sessionId,

                candidate:
                  data.candidate,

                role,

                domain,

                domain_experience:
                  domainExperience,

                question:
                  currentQuestion,

                answer:
                  finalAnswer,

                question_number:
                  currentQuestionNumber,

                total_questions:
                  totalQuestions,

                reference_questions:
                  referenceQuestions,

                is_followup:
                  currentIsFollowup,
              }),
            }
          );

        if (!response.ok) {

          const errorText =
            await response.text();

          throw new Error(
            errorText ||
            "Failed to process answer."
          );
        }

        const result:
          AnswerResult =
          await response.json();

        console.log(
          "Answer result:",
          result
        );

        // =====================================================
        // SCORE
        // =====================================================

        const answerScore =
          result.score ?? null;

        const answerFeedback =
          result.feedback || "";

        setScore(
          answerScore
        );

        setFeedback(
          answerFeedback
        );

        // =====================================================
        // STORE ANSWER + TRANSCRIPT
        // =====================================================

        storeInterviewAnswer({
          questionNumber:
            currentQuestionNumber,

          question:
            currentQuestion,

          answer:
            finalAnswer,

          score:
            answerScore,

          feedback:
            answerFeedback,

          isFollowup:
            currentIsFollowup,
        });

        // =====================================================
        // EARLY END
        // =====================================================

        /*
         * If the candidate clicked End Interview while
         * answering this question, the current answer has now
         * been evaluated and stored.
         *
         * DO NOT:
         * - generate a follow-up
         * - move to the next question
         * - restart audio
         *
         * Simply finalize the interview.
         */

        if (endingInterviewRef.current) {

          console.log(
            "Final answer evaluated. Ending interview."
          );

          transcriptRef.current =
            "";

          setTranscript(
            ""
          );

          setIsEvaluating(
            false
          );

          processingAnswerRef.current =
            false;

          await finalizeInterview();

          return;
        }

        // =====================================================
        // FOLLOW-UP SAFETY LOGIC
        // =====================================================

        /*
         * This is the follow-up logic taken from the NEW code.
         *
         * For a normal/main question:
         *   score < 4 + follow-up question exists
         *   => stay on the same question and show follow-up.
         *
         * For a follow-up:
         *   NEVER create another follow-up.
         */

        const returnedFollowupQuestion =
          (
            result.followup_question ||
            result.next_question ||
            ""
          ).trim();

        const currentScore =
          Number(result.score ?? 0);

        const shouldFollowup =
          !currentIsFollowup &&
          currentScore < 4 &&
          Boolean(
            returnedFollowupQuestion
          );

        // =====================================================
        // FINAL QUESTION
        // =====================================================

        /*
         * Keep the OLD final-question behavior.
         *
         * The final question is stored and the interview is
         * marked completed. The user can then click End Interview.
         *
         * IMPORTANT:
         * This happens after storing the answer and before moving
         * to another main question.
         */

        if (
          currentQuestionNumber >=
            totalQuestions &&
          !shouldFollowup
        ) {

          console.log(
            "Final interview question completed."
          );

          setAudioStatus(
            "All questions completed. You can end the interview."
          );

          setIsEvaluating(false);

          processingAnswerRef.current =
            false;

          /*
           * Keep interviewEndedRef false here because the
           * End Interview button is still supposed to be used.
           */

          interviewEndedRef.current =
            false;

          setInterviewCompleted(
            true
          );

          stopTranscriptPolling();

          await stopAudioService();

          return;
        }

        // =====================================================
        // BACKEND COMPLETE
        // =====================================================

        if (
          result.action ===
            "complete" &&
          !shouldFollowup
        ) {

          setAudioStatus(
            "Interview completed. You can end the interview."
          );

          setIsEvaluating(false);

          processingAnswerRef.current =
            false;

          setInterviewCompleted(
            true
          );

          stopTranscriptPolling();

          await stopAudioService();

          return;
        }

        // =====================================================
        // FOLLOW-UP
        // =====================================================

        /*
         * IMPORTANT:
         *
         * We check BOTH:
         *
         * 1. result.action === "followup"
         * 2. shouldFollowup
         *
         * This makes the frontend robust if the backend returns
         * the follow-up question with the expected score but does
         * not explicitly set action = "followup".
         */

        if (
          result.action === "followup" ||
          shouldFollowup
        ) {

          if (
            returnedFollowupQuestion
          ) {

            const followup =
              returnedFollowupQuestion;

            setQuestion(
              followup
            );

            questionRef.current =
              followup;

            /*
             * Follow-up belongs to the SAME
             * main question number.
             */

            questionNumberRef.current =
              currentQuestionNumber;

            setQuestionNumber(
              currentQuestionNumber
            );

            isFollowupRef.current =
              true;

            setIsFollowup(
              true
            );

            setAudioStatus(
              "Follow-up question — starting audio..."
            );
          }

          /*
           * IMPORTANT:
           *
           * Do NOT return here.
           *
           * The old code continues into the common cleanup
           * and audio restart section.
           */
        }

        // =====================================================
        // NEXT QUESTION
        // =====================================================

        /*
         * Only move to the next question when:
         *
         * - backend says "next"
         * - AND we are NOT forcing a follow-up
         *
         * This prevents a low-scoring main question from
         * accidentally advancing to the next question.
         */

        if (
          result.action === "next" &&
          !shouldFollowup
        ) {

          const nextQuestion =
            result.next_question;

          const nextNumber =
            currentQuestionNumber + 1;

          // ---------------------------------------------------
          // SAFETY CHECK
          // ---------------------------------------------------

          if (
            nextNumber >
            totalQuestions
          ) {

            setAudioStatus(
              "All questions completed. You can end the interview."
            );

            setIsEvaluating(false);

            processingAnswerRef.current =
              false;

            setInterviewCompleted(
              true
            );

            stopTranscriptPolling();

            await stopAudioService();

            return;
          }

          if (
            nextQuestion
          ) {

            /*
             * We are moving to a NEW main question.
             * Therefore reset follow-up state.
             */

            isFollowupRef.current =
              false;

            setIsFollowup(
              false
            );

            setQuestion(
              nextQuestion
            );

            questionRef.current =
              nextQuestion;

            questionNumberRef.current =
              nextNumber;

            setQuestionNumber(
              nextNumber
            );

            setAudioStatus(
              "New question — starting audio..."
            );
          }
        }

        // =====================================================
        // CLEAR OLD ANSWER
        // =====================================================

        transcriptRef.current =
          "";

        setTranscript(
          ""
        );

        setIsEvaluating(
          false
        );

        processingAnswerRef.current =
          false;

        // =====================================================
        // START AUDIO AGAIN
        // =====================================================

        if (
          componentMountedRef.current &&
          !interviewEndedRef.current
        ) {

          setTimeout(
            async () => {

              if (
                !componentMountedRef.current ||
                interviewEndedRef.current
              ) {

                return;
              }

              const started =
                await startAudioService();

              if (
                started &&
                componentMountedRef.current &&
                !interviewEndedRef.current
              ) {

                startTranscriptPolling();
              }

            },
            500
          );
        }

      } catch (error) {

        console.error(
          "Answer processing failed:",
          error
        );

        setAudioStatus(
          error instanceof Error
            ? error.message
            : "Unable to process response."
        );

        setIsEvaluating(
          false
        );

        processingAnswerRef.current =
          false;

        /*
         * If the candidate was trying to end the interview,
         * do not silently restart the interview after an error.
         *
         * The candidate can retry End Interview.
         */

        if (endingInterviewRef.current) {

          interviewEndedRef.current =
            false;

          endingInterviewRef.current =
            false;

          return;
        }

        // -----------------------------------------------------
        // TRY TO RESTART AUDIO
        // -----------------------------------------------------

        if (
          componentMountedRef.current &&
          !interviewEndedRef.current
        ) {

          setTimeout(
            async () => {

              if (
                !componentMountedRef.current ||
                interviewEndedRef.current
              ) {

                return;
              }

              const started =
                await startAudioService();

              if (
                started &&
                componentMountedRef.current &&
                !interviewEndedRef.current
              ) {

                startTranscriptPolling();
              }

            },
            500
          );
        }
      }
    };

  // =========================================================
  // SUBMIT / CONTINUE BUTTON
  // =========================================================

  const handleNextQuestion =
    () => {

      if (isEvaluating) {

        return;
      }

      const answer =
        transcriptRef.current.trim();

      if (!answer) {

        setAudioStatus(
          "Waiting for candidate answer..."
        );

        return;
      }

      submitAnswer(
        answer
      );
    };
    
    
// =========================================================
// NEXT QUESTION / SKIP CURRENT QUESTION
// =========================================================
//
// This does NOT submit or evaluate the current question.
//
// It asks the backend to generate a completely NEW question.
// The question number stays the SAME.
//
// Example:
//
// Question 2
//      ↓
// Next Question
//      ↓
// NEW question
//      ↓
// Still Question 2
//
// The skipped question is never stored.
// =========================================================

const handleSkipToNextQuestion =
  async () => {

    if (isEvaluating) {
      return;
    }

    if (processingAnswerRef.current) {
      return;
    }

    if (interviewCompleted) {
      return;
    }

    const data =
      interviewDataRef.current;

    if (!data) {

      setAudioStatus(
        "Interview data is unavailable."
      );

      return;
    }

    console.log(
      "Skipping current question and generating a NEW question..."
    );

    // -------------------------------------------------------
    // STOP CURRENT AUDIO / TRANSCRIPT
    // -------------------------------------------------------

    stopTranscriptPolling();

    await stopAudioService();

    // -------------------------------------------------------
    // CLEAR CURRENT ANSWER
    // -------------------------------------------------------

    transcriptRef.current =
      "";

    setTranscript(
      ""
    );

    setScore(
      null
    );

    setFeedback(
      ""
    );

    setAudioStatus(
      "Generating a new question..."
    );

    try {

      // -----------------------------------------------------
      // ASK BACKEND FOR ONE COMPLETELY NEW QUESTION
      // -----------------------------------------------------

      const response =
        await fetch(
          `${API_BASE_URL}/api/generate-interview-questions`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              candidate:
                data.candidate || {},

              formData:
                data.formData || {},

              numberOfQuestions:
                1,

              generateSingleQuestion:
                true,

              excludedQuestion:
                questionRef.current,

            }),
          }
        );

      // -----------------------------------------------------
      // HTTP ERROR
      // -----------------------------------------------------

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText ||
          "Failed to generate a new question."
        );
      }

      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      const result =
        await response.json();

      console.log(
        "Replacement question response:",
        result
      );

      // -----------------------------------------------------
      // GET NEW QUESTION
      // -----------------------------------------------------

      const newQuestion =
        result.questions?.[0] ||
        result.question ||
        "";

      if (!newQuestion) {

        throw new Error(
          "No new question was generated."
        );
      }

      // -----------------------------------------------------
      // SET NEW QUESTION
      //
      // IMPORTANT:
      //
      // questionNumberRef is NOT changed.
      // setQuestionNumber is NOT changed.
      //
      // Therefore:
      //
      // Q2 → Skip → NEW QUESTION still = Q2
      // Q10 → Skip → NEW QUESTION still = Q10
      // -----------------------------------------------------

      questionRef.current =
        newQuestion;

      setQuestion(
        newQuestion
      );

      // -----------------------------------------------------
      // RESET FOLLOW-UP
      // -----------------------------------------------------

      isFollowupRef.current =
        false;

      setIsFollowup(
        false
      );

      console.log(
        "New replacement question:",
        newQuestion
      );

      console.log(
        "Question number remains:",
        questionNumberRef.current
      );

      console.log(
        "Skipped question was NOT stored or evaluated."
      );

      setAudioStatus(
        "New question — starting audio..."
      );

      // -----------------------------------------------------
      // START AUDIO AGAIN
      // -----------------------------------------------------

      if (
        componentMountedRef.current &&
        !interviewEndedRef.current
      ) {

        setTimeout(
          async () => {

            if (
              !componentMountedRef.current ||
              interviewEndedRef.current
            ) {
              return;
            }

            const started =
              await startAudioService();

            if (
              started &&
              componentMountedRef.current &&
              !interviewEndedRef.current
            ) {

              startTranscriptPolling();
            }

          },
          300
        );
      }

    } catch (error) {

      console.error(
        "Failed to generate replacement question:",
        error
      );

      setAudioStatus(
        error instanceof Error
          ? error.message
          : "Unable to generate a new question."
      );

      // -----------------------------------------------------
      // RESTART AUDIO IF GENERATION FAILS
      // -----------------------------------------------------

      if (
        componentMountedRef.current &&
        !interviewEndedRef.current
      ) {

        setTimeout(
          async () => {

            if (
              !componentMountedRef.current ||
              interviewEndedRef.current
            ) {
              return;
            }

            const started =
              await startAudioService();

            if (
              started &&
              componentMountedRef.current &&
              !interviewEndedRef.current
            ) {

              startTranscriptPolling();
            }

          },
          300
        );
      }
    }
  };

  // =========================================================
  // END INTERVIEW
  // =========================================================

  const handleEndInterview =
    async () => {

      /*
       * Prevent multiple clicks while the current answer
       * is being processed.
       */

      if (isEvaluating) {
        return;
      }

      /*
       * Prevent accidentally triggering End Interview
       * multiple times.
       */

      if (endingInterviewRef.current) {
        return;
      }

      console.log(
        "Candidate clicked End Interview."
      );

      // -------------------------------------------------------
      // CONFIRMATION
      // -------------------------------------------------------

      const confirmed =
        window.confirm(
          "Are you sure you want to end the interview? Your completed answers will be evaluated and the report will be generated."
        );

      if (!confirmed) {
        return;
      }

      // -------------------------------------------------------
      // MARK INTERVIEW AS ENDING
      // -------------------------------------------------------

      endingInterviewRef.current =
        true;

      interviewEndedRef.current =
        true;

      // -------------------------------------------------------
      // STOP TRANSCRIPT POLLING
      // -------------------------------------------------------

      stopTranscriptPolling();

      // -------------------------------------------------------
      // GET CURRENT ANSWER
      // -------------------------------------------------------

      const currentAnswer =
        transcriptRef.current.trim();

      // -------------------------------------------------------
      // CURRENT ANSWER EXISTS
      // -------------------------------------------------------

      if (currentAnswer) {

        console.log(
          "Current answer exists. Evaluating before ending."
        );

        setAudioStatus(
          "Evaluating final answer..."
        );

        /*
         * submitAnswer will:
         *
         * 1. Send current answer to backend
         * 2. Receive score + feedback
         * 3. Store the answer
         * 4. Detect endingInterviewRef
         * 5. Finalize the interview
         *
         * It will NOT generate another question.
         */

        await submitAnswer(
          currentAnswer
        );

        return;
      }

      // -------------------------------------------------------
      // NO CURRENT ANSWER
      // -------------------------------------------------------

      console.log(
        "No current answer. Ending interview immediately."
      );

      await finalizeInterview();
    };

  // =========================================================
  // HEADER DATA
  // =========================================================

  const candidateName =
    interviewData?.candidate?.fullName ||
    "Candidate";

  const role =
    interviewData?.formData?.role ||
    interviewData?.candidate?.currentRole ||
    "Technical Interview";

  const domain =
    interviewData?.formData?.domain ||
    "Technical";

  const experience =
    interviewData?.formData?.domainExperience ||
    interviewData?.candidate?.experience ||
    "";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="live-interview-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="live-interview-header">

        <div className="live-header-left">

          <div className="mirafra-logo">

            <div className="mirafra-name">
              mirafra
            </div>

            <div className="mirafra-tech">
              TECHNOLOGIES
            </div>

          </div>

          <div className="header-divider" />

          <div className="intellihire-brand">

            <strong>
              IntelliHire
            </strong>

            <span>
              AI Interviewer Assistant
            </span>

          </div>

        </div>

        {/* =================================================
            END INTERVIEW
        ================================================= */}

        <button
          className="end-interview-button"
          type="button"
          onClick={handleEndInterview}
          disabled={isEvaluating}
        >
          End Interview
        </button>

      </header>

      {/* ===================================================
          CANDIDATE INFO
      =================================================== */}

      <section className="candidate-info-bar">

        <div className="candidate-details">

          <h2>
            {candidateName}
          </h2>

          <div className="candidate-meta">

            <span>
              <strong>
                Role:
              </strong>{" "}
              {role}
            </span>

            <span>
              <strong>
                Domain:
              </strong>{" "}
              {domain}
            </span>

            <span>
              <strong>
                Experience:
              </strong>{" "}
              {experience ||
                "Not specified"}
            </span>

          </div>

        </div>

        <div className="question-counter">

          <strong>
            Question{" "}
            {questionNumber} of{" "}
            {totalQuestions}
          </strong>

        </div>

      </section>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="live-interview-content">

        {/* =================================================
            QUESTION
        ================================================= */}

        <section className="live-section">

          <div className="live-section-heading">

            <span>
              {isFollowup
                ? "FOLLOW-UP QUESTION"
                : ""}
            </span>

          </div>

          <div
            className={
              isFollowup
                ? "live-question-card followup-question-card"
                : "live-question-card"
            }
          >

            <h3>
              {question ||
                "Preparing interview question..."}
            </h3>

          </div>

        </section>

        {/* =================================================
            ANSWER
        ================================================= */}

        <section className="live-section">

          <div className="answer-heading">

            <span>
              Answer:
            </span>

            <span
              className={
                isListening
                  ? "audio-live-status active"
                  : "audio-live-status"
              }
            >

              <span className="audio-dot" />

              {audioStatus}

            </span>

          </div>

          {/* =================================================
              CANDIDATE TRANSCRIPT BOX
          ================================================= */}

          <div className="answer-card">

            {transcript ? (

              <div className="live-transcript">
                {transcript}
              </div>

            ) : (

              <div className="answer-placeholder">

                {isListening
                  ? "Listening to candidate..."
                  : "Candidate answer will appear here."}

              </div>

            )}

          </div>

          {/* =================================================
              ANSWER BOTTOM
          ================================================= */}

          <div className="answer-bottom">

            <div className="small-score">

              {score !== null ? (

                <>
                  Score:{" "}
                  <strong>
                    {score}/10
                  </strong>
                </>

              ) : (

                <>
                  Score:{" "}
                  <strong>
                    --/10
                  </strong>
                </>

              )}

            </div>

            {/* =================================================
                SUBMIT / CONTINUE BUTTON
            ================================================= */}

        {!interviewCompleted && (
          <div className="interview-action-buttons">

            <button
              type="button"
              className="skip-question-button"
              onClick={handleSkipToNextQuestion}
              disabled={isEvaluating}
            >
              Skip Question →
            </button>

            <button
              type="button"
              className="next-question-button"
              onClick={handleNextQuestion}
              disabled={
                isEvaluating ||
                !transcript.trim()
              }
            >
              {questionNumber === totalQuestions
                ? "Submit"
                : "Submit & Continue →"}
                        </button>

          </div>
        )}

      </div>
    </section>
  </main>
</div>
  );

};

export default LiveInterview;