import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  Assignment,
  Question,
  Answer,
  Submission,
} from "../../types/assignment";
import {
  getAssignmentDetail,
  submitAssignment,
  getSubmissionDetail,
  deleteSubmissionByAssignment,
} from "../../api/assignment";
import AutoGradeResults from "./AutoGradeResults";
import ConfirmationModal from "../../components/ConfirmationModal";

// Add custom styles for better UI
const customStyles = `
  .hover-bg-light:hover {
    background-color: #f8f9fa !important;
    cursor: pointer;
  }
  .question-card {
    border-left: 4px solid #0d6efd;
    transition: box-shadow 0.2s ease-in-out;
  }
  .question-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
  .answer-option {
    transition: all 0.2s ease-in-out;
  }
  .answer-option:hover {
    background-color: #e3f2fd;
  }
  .answer-option input:checked + label {
    color: #0d6efd;
    font-weight: 600;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showGradeResults, setShowGradeResults] = useState(false);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssignmentDetail();
      checkExistingSubmission();
    }
  }, [id]);

  useEffect(() => {
    let timer: number;

    if (hasStarted && timeRemaining !== null && timeRemaining > 0) {
      timer = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [hasStarted, timeRemaining]);

  const fetchAssignmentDetail = async () => {
    try {
      const res = await getAssignmentDetail(id!);
      // Handle both {data: ...} or direct object
      const assignmentData = (res as any).data || res;

      // Log if questions is missing (for debugging)
      if (!assignmentData.questions) {
        console.warn(
          "Assignment data is missing questions array:",
          assignmentData
        );
      }

      // Ensure every question has a unique id
      if (assignmentData.questions && assignmentData.questions.length > 0) {
        assignmentData.questions = assignmentData.questions.map(
          (q: any, idx: number) => ({
            ...q,
            id: q._id ? q._id.toString() : q.id ?? `q_${idx}`,
          })
        );
        const initialAnswers: Answer[] = assignmentData.questions.map(
          (q: any) => ({
            questionId: q._id ? q._id.toString() : q.id ?? "",
            answer: "",
          })
        );
        setAnswers(initialAnswers);
        console.log("[DEBUG] Initial answers:", initialAnswers);
      }
      setAssignment(assignmentData);

      // Set time limit if exists
      if (assignmentData.timeLimit) {
        setTimeRemaining(assignmentData.timeLimit * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error(t("assignment.fetchError") || "Error loading assignment");
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const submissionData = await getSubmissionDetail(id!);
      console.log("Found existing submission:", submissionData);
      const submission = (submissionData as any).data;
      console.log("Processed submission:", submission);
      // Only set submission if data is not null
      if (submission && submission !== null) {
        setSubmission(submission);
      } else {
        setSubmission(null);
      }
    } catch (error) {
      // No submission found - this is normal for new assignments
      console.log("No existing submission found - ready to start assignment");
      setSubmission(null);
    }
  };

  const handleStartAssignment = () => {
    setHasStarted(true);
    toast.info(t("assignment.started") || "Assignment started!");
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | boolean | number
  ) => {
    setAnswers((prev) => {
      const updated = prev.map((a) =>
        a.questionId === questionId ? { ...a, answer, questionId } : a
      );
      console.log(
        `[DEBUG] Answers after change for questionId ${questionId}:`,
        updated
      );
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!assignment || submitting) return;

    // Validate all questions are answered
    const unansweredQuestions = answers.filter(
      (a) => a.answer === "" || a.answer === null || a.answer === undefined
    );

    if (unansweredQuestions.length > 0) {
      toast.warning(
        t("assignment.completeAllQuestions") ||
          "Please answer all questions before submitting"
      );
      return;
    }

    setSubmitting(true);

    try {
      console.log("[DEBUG] Submitting answers:", { id, answers });
      const result = await submitAssignment(id!, answers);
      console.log("[DEBUG] API response from submitAssignment:", result);

      if (result.success) {
        toast.success(
          result.message ||
            t("assignment.submitSuccess") ||
            "Assignment submitted successfully!"
        );

        if (result.autoGraded && result.score !== undefined) {
          // Show detailed results for auto-graded assignments
          const scorePercentage = result.maxScore
            ? ((result.score / result.maxScore) * 100).toFixed(1)
            : "0";

          toast.success(
            `🎯 Auto-graded Score: ${result.score}/${
              result.maxScore || assignment.totalPoints
            } (${scorePercentage}%)`,
            {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );

          // Show detailed results modal
          setTimeout(() => {
            setShowGradeResults(true);
          }, 1000);

          if (
            result.autoGradeableScore !== undefined &&
            result.autoGradeableScore !== result.score
          ) {
            toast.info(
              `📝 Auto-gradeable questions: ${result.autoGradeableScore} points`,
              { autoClose: 4000 }
            );
          }
        } else {
          toast.info(
            t("assignment.manualGrading") ||
              "Your submission has been received and will be graded by your instructor"
          );
        }

        // Refresh submission data
        await checkExistingSubmission();
        setHasStarted(false);
      } else {
        toast.error(
          result.message ||
            t("assignment.submitError") ||
            "Error submitting assignment"
        );
      }
    } catch (error: any) {
      console.error("Error submitting assignment:", error);
      // Try to get error message from backend response
      let msg = t("assignment.submitError") || "Error submitting assignment";
      if (error?.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error?.message) {
        msg = error.message;
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning(
      t("assignment.timeUp") || "Time is up! Auto-submitting assignment..."
    );
    await handleSubmit();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const renderQuestion = (question: Question, index: number) => {
    const currentAnswer = answers.find((a) => a.questionId === question.id);

    return (
      <div key={question.id} className="card mb-4 question-card">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0 d-flex justify-content-between align-items-center">
            <span>
              <span className="badge bg-primary me-2">
                {t("assignment.questionNumber", { number: index + 1 })}
              </span>
              <span className="text-dark">
                {t("assignment.typeLabel")}:{" "}
                {t(`assignment.type.${question.type}`)}
              </span>
            </span>
            <span className="badge bg-success">
              {question.points} {t("assignment.points")}
            </span>
          </h5>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <div className="d-flex align-items-start mb-3">
              <i className="fas fa-question-circle text-primary me-2 mt-1"></i>
              <div>
                <strong className="text-primary">
                  {t("assignment.questionContent")}
                </strong>
                <p className="card-text mt-2 fs-5 lh-base">
                  {question.question}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="d-flex align-items-center mb-3">
              <i className="fas fa-edit text-success me-2"></i>
              <strong className="text-success">
                {t("assignment.selectAnswer")}
              </strong>
            </div>

            {question.type === "multiple_choice" && question.options && (
              <div className="mt-3">
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="form-check mb-3 p-3 border rounded answer-option"
                  >
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`question_${question.id}`}
                      id={`question_${question.id}_option_${optionIndex}`}
                      value={option}
                      checked={currentAnswer?.answer === option}
                      onChange={(e) =>
                        handleAnswerChange(question.id!, e.target.value)
                      }
                      disabled={!hasStarted || submission !== null}
                    />
                    <label
                      className="form-check-label fs-6 ms-2 w-100"
                      htmlFor={`question_${question.id}_option_${optionIndex}`}
                    >
                      <span className="fw-bold me-2 text-primary">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option}
                    </label>
                  </div>
                ))}
              </div>
            )}

            {question.type === "true_false" && (
              <div className="mt-3">
                <div className="form-check mb-3 p-3 border rounded answer-option">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question_${question.id}`}
                    id={`question_${question.id}_true`}
                    value="true"
                    checked={currentAnswer?.answer === true}
                    onChange={(e) =>
                      handleAnswerChange(
                        question.id!,
                        e.target.value === "true"
                      )
                    }
                    disabled={!hasStarted || submission !== null}
                  />
                  <label
                    className="form-check-label fs-6 ms-2 w-100"
                    htmlFor={`question_${question.id}_true`}
                  >
                    <span className="fw-bold me-2 text-primary">A.</span>
                    <i className="fas fa-check text-success me-2"></i>
                    {t("assignment.true") || "Đúng"}
                  </label>
                </div>
                <div className="form-check p-3 border rounded answer-option">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question_${question.id}`}
                    id={`question_${question.id}_false`}
                    value="false"
                    checked={currentAnswer?.answer === false}
                    onChange={(e) =>
                      handleAnswerChange(
                        question.id!,
                        e.target.value === "true"
                      )
                    }
                    disabled={!hasStarted || submission !== null}
                  />
                  <label
                    className="form-check-label fs-6 ms-2 w-100"
                    htmlFor={`question_${question.id}_false`}
                  >
                    <span className="fw-bold me-2 text-primary">B.</span>
                    <i className="fas fa-times text-danger me-2"></i>
                    {t("assignment.false") || "Sai"}
                  </label>
                </div>
              </div>
            )}

            {question.type === "essay" && (
              <div className="mt-3">
                <label className="form-label fw-bold d-flex align-items-center">
                  <i className="fas fa-pencil-alt text-primary me-2"></i>
                  Câu trả lời của bạn:
                </label>
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder={
                    t("assignment.enterAnswer") ||
                    "Nhập câu trả lời của bạn tại đây..."
                  }
                  value={(currentAnswer?.answer as string) || ""}
                  onChange={(e) =>
                    handleAnswerChange(question.id!, e.target.value)
                  }
                  disabled={!hasStarted || submission !== null}
                  style={{ minHeight: "120px", fontSize: "16px" }}
                />
                <small className="text-muted d-flex align-items-center mt-2">
                  <i className="fas fa-info-circle me-1"></i>
                  Hãy trả lời chi tiết và rõ ràng nhất có thể.
                </small>
              </div>
            )}

            {/* Status indicator */}
            <div className="mt-4 d-flex justify-content-between align-items-center">
              <div>
                {currentAnswer?.answer !== "" &&
                currentAnswer?.answer !== null &&
                currentAnswer?.answer !== undefined ? (
                  <span className="badge bg-success fs-6 p-2">
                    <i className="fas fa-check-circle me-1"></i>{" "}
                    {t("assignment.answered")}
                  </span>
                ) : (
                  <span className="badge bg-warning fs-6 p-2">
                    <i className="fas fa-clock me-1"></i>{" "}
                    {t("assignment.notAnswered")}
                  </span>
                )}
              </div>
              <small className="text-muted">
                {t("assignment.questionProgress", {
                  current: index + 1,
                  total: assignment?.questions?.length || 0,
                })}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">{t("loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  // Debug logs để kiểm tra trạng thái
  console.log("Assignment Detail Debug:", {
    assignment: assignment?.title,
    hasQuestions: assignment?.questions?.length,
    submission: submission?.id,
    hasStarted,
    loading,
  });

  if (!assignment) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {t("assignment.notFound") || "Assignment not found"}
        </div>
      </div>
    );
  }

  // Retake assignment handler
  const handleRetake = async () => {
    setShowRetakeConfirm(true);
  };

  const confirmRetake = async () => {
    if (!id) return;

    try {
      setShowRetakeConfirm(false);
      setLoading(true);
      await deleteSubmissionByAssignment(id);
      setSubmission(null);
      setAnswers(
        assignment?.questions?.map((q: any) => ({
          questionId: q._id ? q._id.toString() : q.id ?? "",
          answer: "",
        })) || []
      );
      setHasStarted(false);
      toast.success(
        t("assignment.retakeSuccess") || "You can retake the assignment now."
      );
    } catch (error: any) {
      toast.error(error?.message || "Failed to retake assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h2>{assignment.title}</h2>
                {timeRemaining !== null && hasStarted && (
                  <div
                    className={`badge ${
                      timeRemaining < 300 ? "bg-danger" : "bg-primary"
                    } fs-6`}
                  >
                    {t("assignment.timeRemaining")}: {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
              <div className="card-body">
                <p className="card-text">{assignment.description}</p>
                {assignment.instructions && (
                  <div className="alert alert-info">
                    <strong>{t("assignment.instructions")}:</strong>{" "}
                    {assignment.instructions}
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>{t("assignment.totalPoints")}:</strong>{" "}
                    {assignment.totalPoints}
                  </div>
                  <div className="col-md-6">
                    <strong>{t("assignment.questions")}:</strong>{" "}
                    {assignment.questions?.length || 0}
                  </div>
                  {assignment.timeLimit && (
                    <div className="col-md-6 mt-2">
                      <strong>{t("assignment.timeLimit")}:</strong>{" "}
                      {assignment.timeLimit} {t("assignment.minutes")}
                    </div>
                  )}
                  {assignment.dueDate && (
                    <div className="col-md-6 mt-2">
                      <strong>{t("assignment.dueDate")}:</strong>{" "}
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Show submission results if exists */}
            {submission && (
              <div className="card mb-4">
                <div className="card-header">
                  <h4>{t("assignment.submissionResults")}</h4>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <strong>{t("assignment.statusLabel")}:</strong>
                      <span
                        className={`badge ms-2 ${
                          submission.status === "graded"
                            ? "bg-success"
                            : submission.status === "submitted"
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                      >
                        {submission.status || "submitted"}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <strong>{t("assignment.submittedAt")}:</strong>{" "}
                      {submission.submittedAt
                        ? new Date(submission.submittedAt).toLocaleString()
                        : "N/A"}
                    </div>
                    {submission.score !== undefined && (
                      <div className="col-md-6 mt-2">
                        <strong>{t("assignment.score")}:</strong>{" "}
                        {submission.score}/{assignment.totalPoints}
                      </div>
                    )}
                    {submission.gradedAt && (
                      <div className="col-md-6 mt-2">
                        <strong>{t("assignment.gradedAt")}:</strong>{" "}
                        {new Date(submission.gradedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  {submission.feedback && (
                    <div className="mt-3">
                      <strong>{t("assignment.feedback")}:</strong>
                      <div className="alert alert-info mt-2">
                        {submission.feedback}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment Questions */}
            {!submission && (
              <>
                {!hasStarted ? (
                  <div className="text-center mb-4">
                    {assignment.questions && assignment.questions.length > 0 ? (
                      <>
                        <button
                          className="btn btn-primary btn-lg"
                          onClick={handleStartAssignment}
                        >
                          {t("assignment.startAssignment") || "Làm bài tập"}
                        </button>
                        {assignment.timeLimit && (
                          <p className="mt-2 text-muted">
                            {t("assignment.timeLimitWarning", {
                              minutes: assignment.timeLimit,
                            }) ||
                              `You have ${assignment.timeLimit} minutes to complete this assignment once you start.`}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="alert alert-info" role="alert">
                        <h5>{t("assignment.notReadyTitle")}</h5>
                        <p>{t("assignment.notReadyDesc")}</p>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => navigate(-1)}
                        >
                          {t("assignment.back")}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {assignment.questions && assignment.questions.length > 0 ? (
                      assignment.questions.map((question, index) =>
                        renderQuestion(question, index)
                      )
                    ) : (
                      <div className="alert alert-warning" role="alert">
                        <h5 className="text-center">
                          {t("assignment.noQuestionsTitle")}
                        </h5>
                        <p className="text-center">
                          {t("assignment.noQuestionsDesc")}
                        </p>
                      </div>
                    )}

                    {assignment.questions &&
                      assignment.questions.length > 0 && (
                        <div className="card mt-4 bg-light">
                          <div className="card-body text-center">
                            <h5 className="card-title text-primary mb-3">
                              <i className="fas fa-paper-plane me-2"></i>
                              {t("assignment.finishAssignment")}
                            </h5>
                            <p className="text-muted mb-4">
                              {t("assignment.checkBeforeSubmit")}
                            </p>

                            {/* Progress summary */}
                            <div className="row mb-4">
                              <div className="col-md-4">
                                <div className="text-center">
                                  <h6 className="text-success">
                                    {t("assignment.answered")}
                                  </h6>
                                  <span className="badge bg-success fs-6 p-2">
                                    {
                                      answers.filter(
                                        (a) =>
                                          a.answer !== "" &&
                                          a.answer !== null &&
                                          a.answer !== undefined
                                      ).length
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="text-center">
                                  <h6 className="text-warning">
                                    {t("assignment.notAnswered")}
                                  </h6>
                                  <span className="badge bg-warning fs-6 p-2">
                                    {
                                      answers.filter(
                                        (a) =>
                                          a.answer === "" ||
                                          a.answer === null ||
                                          a.answer === undefined
                                      ).length
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="text-center">
                                  <h6 className="text-info">
                                    {t("assignment.totalQuestions")}
                                  </h6>
                                  <span className="badge bg-info fs-6 p-2">
                                    {assignment.questions.length}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="d-flex justify-content-center gap-3">
                              <button
                                className="btn btn-success btn-lg px-4"
                                onClick={handleSubmit}
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <span
                                      className="spinner-border spinner-border-sm me-2"
                                      role="status"
                                      aria-hidden="true"
                                    ></span>
                                    {t("assignment.submitting")}
                                  </>
                                ) : (
                                  <>
                                    <i className="fas fa-check-circle me-2"></i>
                                    {t("assignment.submitAssignment")}
                                  </>
                                )}
                              </button>
                              <button
                                className="btn btn-outline-secondary btn-lg px-4"
                                onClick={() => navigate(-1)}
                              >
                                <i className="fas fa-arrow-left me-2"></i>
                                {t("assignment.back")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                  </>
                )}
              </>
            )}

            {submission && (
              <div className="text-center mt-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title text-success mb-3">
                      <i className="fas fa-check-circle me-2"></i>
                      {t("assignment.completedTitle")}
                    </h5>
                    <p className="text-muted mb-4">
                      {t("assignment.completedDesc")}
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleRetake}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {t("assignment.retaking") || "Retaking..."}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-redo me-2"></i>
                            {t("assignment.retake") || "Retake Assignment"}
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-lg"
                        onClick={() => navigate(-1)}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        {t("assignment.back")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h5>{t("assignment.progress")}</h5>
              </div>
              <div className="card-body">
                {hasStarted && !submission ? (
                  <>
                    <p>
                      {t("assignment.questionsAnswered")}:{" "}
                      {
                        answers.filter(
                          (a) =>
                            a.answer !== "" &&
                            a.answer !== null &&
                            a.answer !== undefined
                        ).length
                      }
                      /{assignment.questions?.length || 0}
                    </p>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        role="progressbar"
                        style={{
                          width: `${
                            (answers.filter(
                              (a) =>
                                a.answer !== "" &&
                                a.answer !== null &&
                                a.answer !== undefined
                            ).length /
                              (assignment.questions?.length || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </>
                ) : submission ? (
                  <p className="text-success">
                    {t("assignment.completed") || "Assignment completed!"}
                  </p>
                ) : (
                  <p className="text-muted">
                    {t("assignment.notStarted") || "Assignment not started"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Grade Results Modal */}
      {assignment && (
        <AutoGradeResults
          assignment={assignment}
          answers={answers}
          show={showGradeResults}
          onClose={() => setShowGradeResults(false)}
        />
      )}

      {/* Retake Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRetakeConfirm}
        title={t("assignment.retakeTitle") || "Retake Assignment"}
        message={
          t("assignment.confirmRetake") ||
          "Are you sure you want to retake this assignment? Your current submission will be deleted and you'll start fresh."
        }
        confirmText={t("assignment.retake") || "Retake"}
        cancelText={t("common.cancel") || "Cancel"}
        onConfirm={confirmRetake}
        onCancel={() => setShowRetakeConfirm(false)}
        variant="warning"
        icon="fas fa-redo"
      />

      <ToastContainer position="top-center" autoClose={2500} />
    </>
  );
};

export default AssignmentDetail;
