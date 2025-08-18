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
      const assignmentData = res; // handle both {data: ...} or direct object
      setAssignment(assignmentData);

      // Initialize answers array
      if (assignmentData.questions) {
        const initialAnswers: Answer[] = assignmentData.questions.map(
          (q: any, idx: number) => ({
            questionId: idx.toString(),
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
    const currentAnswer = answers.find(
      (a) => a.questionId === index.toString()
    );

    return (
      <div key={index} className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">
            {t("assignment.question")} {index + 1} ({question.points}{" "}
            {t("assignment.points")})
          </h5>
          <p className="card-text">{question.question}</p>

          {question.type === "multiple_choice" && question.options && (
            <div>
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name={`question_${index}`}
                    id={`question_${index}_option_${optionIndex}`}
                    value={option}
                    checked={currentAnswer?.answer === option}
                    onChange={(e) =>
                      handleAnswerChange(index.toString(), e.target.value)
                    }
                    disabled={!hasStarted || submission !== null}
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`question_${index}_option_${optionIndex}`}
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}

          {question.type === "true_false" && (
            <div>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`question_${index}`}
                  id={`question_${index}_true`}
                  value="true"
                  checked={currentAnswer?.answer === true}
                  onChange={() => handleAnswerChange(index.toString(), true)}
                  disabled={!hasStarted || submission !== null}
                />
                <label
                  className="form-check-label"
                  htmlFor={`question_${index}_true`}
                >
                  {t("assignment.true") || "True"}
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`question_${index}`}
                  id={`question_${index}_false`}
                  value="false"
                  checked={currentAnswer?.answer === false}
                  onChange={() => handleAnswerChange(index.toString(), false)}
                  disabled={!hasStarted || submission !== null}
                />
                <label
                  className="form-check-label"
                  htmlFor={`question_${index}_false`}
                >
                  {t("assignment.false") || "False"}
                </label>
              </div>
            </div>
          )}

          {question.type === "essay" && (
            <textarea
              className="form-control"
              rows={5}
              placeholder={
                t("assignment.enterAnswer") || "Enter your answer..."
              }
              value={(currentAnswer?.answer as string) || ""}
              onChange={(e) =>
                handleAnswerChange(index.toString(), e.target.value)
              }
              disabled={!hasStarted || submission !== null}
            />
          )}
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
                  {assignment.questions.length}
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
                </div>
              ) : (
                <>
                  {assignment.questions.map((question, index) =>
                    renderQuestion(question, index)
                  )}

                  <div className="text-center mt-4">
                    <button
                      className="btn btn-success btn-lg me-3"
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
                          {t("assignment.submitting") || "Submitting..."}
                        </>
                      ) : (
                        t("assignment.submitAssignment") || "Submit Assignment"
                      )}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => navigate(-1)}
                    >
                      {t("assignment.back") || "Back"}
                    </button>
                  </div>
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
                    /{assignment.questions.length}
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
                            assignment.questions.length) *
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
