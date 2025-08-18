import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
} from "../../api/assignment";

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

      setAssignment(assignmentData);

      // Initialize answers array
      if (assignmentData.questions && assignmentData.questions.length > 0) {
        const initialAnswers: Answer[] = assignmentData.questions.map(
          (q: any) => ({
            questionId: q.id!,
            answer:
              q.type === "multiple_choice"
                ? ""
                : q.type === "true_false"
                ? false
                : "",
          })
        );
        setAnswers(initialAnswers);
      }

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
      setSubmission(submissionData);
    } catch (error) {
      // No submission found - this is normal for new assignments
      console.log("No existing submission found");
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
    setAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, answer } : a))
    );
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
      const result = await submitAssignment(id!, answers);

      if (result.success) {
        toast.success(
          t("assignment.submitSuccess") || "Assignment submitted successfully!"
        );

        if (result.autoGraded) {
          // Show immediate results for auto-graded assignments
          toast.info(
            `${t("assignment.score") || "Score"}: ${result.score}/${
              assignment.totalPoints
            }`
          );
          if (result.feedback) {
            toast.info(
              `${t("assignment.feedback") || "Feedback"}: ${result.feedback}`
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
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(t("assignment.submitError") || "Error submitting assignment");
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
              <span className="badge bg-primary me-2">Câu {index + 1}</span>
              <span className="text-dark">
                Loại:{" "}
                {question.type === "multiple_choice"
                  ? "Trắc nghiệm"
                  : question.type === "true_false"
                  ? "Đúng/Sai"
                  : "Tự luận"}
              </span>
            </span>
            <span className="badge bg-success">{question.points} điểm</span>
          </h5>
        </div>
        <div className="card-body">
          <div className="mb-4">
            <div className="d-flex align-items-start mb-3">
              <i className="fas fa-question-circle text-primary me-2 mt-1"></i>
              <div>
                <strong className="text-primary">Nội dung câu hỏi:</strong>
                <p className="card-text mt-2 fs-5 lh-base">
                  {question.question}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="d-flex align-items-center mb-3">
              <i className="fas fa-edit text-success me-2"></i>
              <strong className="text-success">Chọn đáp án của bạn:</strong>
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
                    onChange={() => handleAnswerChange(question.id!, true)}
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
                    onChange={() => handleAnswerChange(question.id!, false)}
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
                    <i className="fas fa-check-circle me-1"></i> Đã trả lời
                  </span>
                ) : (
                  <span className="badge bg-warning fs-6 p-2">
                    <i className="fas fa-clock me-1"></i> Chưa trả lời
                  </span>
                )}
              </div>
              <small className="text-muted">
                Câu hỏi {index + 1} / {assignment?.questions?.length || 0}
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

  if (!assignment) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {t("assignment.notFound") || "Assignment not found"}
        </div>
      </div>
    );
  }

  return (
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
                    <strong>{t("assignment.status")}:</strong>
                    <span
                      className={`badge ms-2 ${
                        submission.status === "graded"
                          ? "bg-success"
                          : submission.status === "submitted"
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                    >
                      {t(`assignment.status.${submission.status}`) ||
                        submission.status}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>{t("assignment.submittedAt")}:</strong>{" "}
                    {new Date(submission.submittedAt).toLocaleString()}
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
                      <h5>Bài tập chưa sẵn sàng</h5>
                      <p>
                        Bài tập này chưa có câu hỏi nào. Vui lòng quay lại sau
                        hoặc liên hệ với giảng viên.
                      </p>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigate(-1)}
                      >
                        {t("assignment.back") || "Quay lại"}
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
                      <h5>Không có câu hỏi nào</h5>
                      <p>
                        Bài tập này hiện tại chưa có câu hỏi nào để làm. Vui
                        lòng liên hệ với giảng viên để biết thêm thông tin.
                      </p>
                    </div>
                  )}

                  {assignment.questions && assignment.questions.length > 0 && (
                    <div className="card mt-4 bg-light">
                      <div className="card-body text-center">
                        <h5 className="card-title text-primary mb-3">
                          <i className="fas fa-paper-plane me-2"></i>
                          Hoàn thành bài tập
                        </h5>
                        <p className="text-muted mb-4">
                          Hãy kiểm tra lại các câu trả lời trước khi nộp bài
                        </p>

                        {/* Progress summary */}
                        <div className="row mb-4">
                          <div className="col-md-4">
                            <div className="text-center">
                              <h6 className="text-success">Đã trả lời</h6>
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
                              <h6 className="text-warning">Chưa trả lời</h6>
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
                              <h6 className="text-info">Tổng câu hỏi</h6>
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
                                {t("assignment.submitting") ||
                                  "Đang nộp bài..."}
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check-circle me-2"></i>
                                {t("assignment.submitAssignment") ||
                                  "Nộp bài tập"}
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-lg px-4"
                            onClick={() => navigate(-1)}
                          >
                            <i className="fas fa-arrow-left me-2"></i>
                            {t("assignment.back") || "Quay lại"}
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
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
              >
                {t("assignment.back") || "Back"}
              </button>
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
  );
};

export default AssignmentDetail;
