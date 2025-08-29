import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Assignment, Question, Answer } from "../../types/assignment";
import {
  getAssignmentDetail,
  getSubmissionDetailWithAnswers,
  gradeSubmission,
  autoGradeSubmission,
} from "../../api/assignment";
import "./AssignmentGrading.css";

interface DetailedSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: Answer[];
  submittedAt: string;
  score?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
  gradedAt?: string;
  gradedBy?: string;
}

const SubmissionDetail: React.FC = () => {
  const { assignmentId, submissionId } = useParams<{
    assignmentId: string;
    submissionId: string;
  }>();
  const { t } = useTranslation();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<DetailedSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [manualGrade, setManualGrade] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (assignmentId && submissionId) {
      fetchData();
    }
  }, [assignmentId, submissionId]);

  const fetchData = async () => {
    try {
      const [assignmentRes, submissionRes] = await Promise.all([
        getAssignmentDetail(assignmentId!),
        getSubmissionDetailWithAnswers(submissionId!),
      ]);

      const assignmentData = (assignmentRes as any).data || assignmentRes;
      const submissionData = (submissionRes as any).data || submissionRes;

      // Ensure questions have IDs
      if (assignmentData.questions) {
        assignmentData.questions = assignmentData.questions.map(
          (q: any, idx: number) => ({
            ...q,
            id: q._id ? q._id.toString() : q.id ?? `q_${idx}`,
          })
        );
      }

      setAssignment(assignmentData);
      setSubmission(submissionData);
      setManualGrade(submissionData.score || 0);
      setFeedback(submissionData.feedback || "");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error loading submission details");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGrade = async () => {
    if (!assignment || !submission || grading) return;

    const autoGradeableQuestions = assignment.questions?.filter(
      (q) => q.type === "multiple_choice" || q.type === "true_false"
    );

    if (!autoGradeableQuestions || autoGradeableQuestions.length === 0) {
      toast.warning("This assignment has no auto-gradeable questions");
      return;
    }

    setGrading(true);

    try {
      // Get instructor ID from localStorage or auth context
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const instructorId = user.id || user._id;

      if (!instructorId) {
        toast.error("Instructor ID not found. Please log in again.");
        return;
      }

      await autoGradeSubmission(submissionId!, instructorId);
      toast.success("Submission auto-graded successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error auto-grading submission:", error);
      toast.error("Error auto-grading submission");
    } finally {
      setGrading(false);
    }
  };

  const handleManualGrade = async () => {
    if (!submission || grading) return;

    setGrading(true);

    try {
      await gradeSubmission(submissionId!, {
        grade: manualGrade,
        feedback: feedback,
      });
      toast.success("Submission graded successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Error grading submission");
    } finally {
      setGrading(false);
    }
  };

  const getAnswerDisplay = (question: Question, answer: Answer) => {
    const studentAnswer = answer.answer;

    if (question.type === "multiple_choice") {
      return (
        <div>
          <strong>Student Answer:</strong>{" "}
          <span
            className={
              studentAnswer === question.correctAnswer
                ? "text-success"
                : "text-danger"
            }
          >
            {studentAnswer}
          </span>
          <br />
          <strong>Correct Answer:</strong>{" "}
          <span className="text-success">{question.correctAnswer}</span>
          {question.options && (
            <div className="mt-2">
              <small className="text-muted">Options:</small>
              <ul className="small">
                {question.options.map((option, idx) => (
                  <li key={idx}>{option}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (question.type === "true_false") {
      return (
        <div>
          <strong>Student Answer:</strong>{" "}
          <span
            className={
              String(studentAnswer) === String(question.correctAnswer)
                ? "text-success"
                : "text-danger"
            }
          >
            {String(studentAnswer)}
          </span>
          <br />
          <strong>Correct Answer:</strong>{" "}
          <span className="text-success">{String(question.correctAnswer)}</span>
        </div>
      );
    }

    if (question.type === "essay") {
      return (
        <div>
          <strong>Student Answer:</strong>
          <div className="mt-2 p-3 bg-light rounded">
            {studentAnswer || (
              <em className="text-muted">No answer provided</em>
            )}
          </div>
        </div>
      );
    }

    return <div>Answer: {String(studentAnswer)}</div>;
  };

  const getQuestionScore = (question: Question, answer: Answer) => {
    if (question.type === "essay") {
      return { earned: 0, possible: question.points, autoGradeable: false };
    }

    const isCorrect =
      question.type === "multiple_choice"
        ? answer.answer === question.correctAnswer
        : String(answer.answer) === String(question.correctAnswer);

    return {
      earned: isCorrect ? question.points : 0,
      possible: question.points,
      autoGradeable: true,
    };
  };

  const calculateAutoGradeScore = () => {
    if (!assignment?.questions || !submission?.answers) return 0;

    let score = 0;
    for (const answer of submission.answers) {
      const question = assignment.questions.find(
        (q) => q.id === answer.questionId
      );
      if (question) {
        const { earned, autoGradeable } = getQuestionScore(question, answer);
        if (autoGradeable) {
          score += earned;
        }
      }
    }
    return score;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment || !submission) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          Assignment or submission not found
        </div>
      </div>
    );
  }

  const autoGradeScore = calculateAutoGradeScore();
  const hasAutoGradeableQuestions = assignment.questions?.some(
    (q) => q.type === "multiple_choice" || q.type === "true_false"
  );

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Submission Detail</h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/assignments/${assignmentId}/submissions`}>
                  Submissions
                </Link>
              </li>
              <li className="breadcrumb-item active">Detail</li>
            </ol>
          </nav>
        </div>
        <div>
          <Link
            to={`/assignments/${assignmentId}/submissions`}
            className="btn btn-outline-secondary me-2"
          >
            <i className="fas fa-arrow-left me-1"></i>
            Back to Submissions
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Submission Info */}
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="card-title mb-0">Submission Information</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Student:</strong>
                <div>{submission.studentName}</div>
                <small className="text-muted">{submission.studentEmail}</small>
              </div>

              <div className="mb-3">
                <strong>Assignment:</strong>
                <div>{assignment.title}</div>
              </div>

              <div className="mb-3">
                <strong>Submitted At:</strong>
                <div>{formatDateTime(submission.submittedAt)}</div>
              </div>

              <div className="mb-3">
                <strong>Status:</strong>
                <div>
                  <span
                    className={`badge ${
                      submission.status === "graded"
                        ? "bg-success"
                        : submission.status === "late"
                        ? "bg-danger"
                        : "bg-warning"
                    }`}
                  >
                    {submission.status}
                  </span>
                </div>
              </div>

              {submission.score !== undefined && (
                <div className="mb-3">
                  <strong>Current Score:</strong>
                  <div className="fs-4 fw-bold text-primary">
                    {submission.score}/{assignment.totalPoints}
                  </div>
                </div>
              )}

              {hasAutoGradeableQuestions && (
                <div className="mb-3">
                  <strong>Auto-Grade Score:</strong>
                  <div className="text-info">
                    {autoGradeScore} points (auto-gradeable questions only)
                  </div>
                </div>
              )}

              {submission.feedback && (
                <div className="mb-3">
                  <strong>Feedback:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {submission.feedback}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grading Panel */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Grading</h5>
            </div>
            <div className="card-body">
              {hasAutoGradeableQuestions &&
                submission.status === "submitted" && (
                  <div className="mb-3">
                    <button
                      className="btn btn-success w-100"
                      onClick={handleAutoGrade}
                      disabled={grading}
                    >
                      {grading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Auto-Grading...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic me-1"></i>
                          Auto-Grade
                        </>
                      )}
                    </button>
                    <small className="text-muted">
                      This will grade multiple choice and true/false questions
                      automatically
                    </small>
                  </div>
                )}

              <div className="mb-3">
                <label htmlFor="manualGrade" className="form-label">
                  Manual Grade (out of {assignment.totalPoints})
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="manualGrade"
                  value={manualGrade}
                  onChange={(e) => setManualGrade(Number(e.target.value))}
                  min={0}
                  max={assignment.totalPoints}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="feedback" className="form-label">
                  Feedback
                </label>
                <textarea
                  className="form-control"
                  id="feedback"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student..."
                ></textarea>
              </div>

              <button
                className="btn btn-primary w-100"
                onClick={handleManualGrade}
                disabled={grading}
              >
                {grading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving Grade...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-1"></i>
                    Save Grade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Questions and Answers</h5>
            </div>
            <div className="card-body">
              {assignment.questions?.map((question, index) => {
                const answer = submission.answers.find(
                  (a) => a.questionId === question.id
                );
                const { earned, possible, autoGradeable } = getQuestionScore(
                  question,
                  answer || { questionId: question.id!, answer: "" }
                );

                return (
                  <div key={question.id} className="border rounded p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h6 className="mb-0">
                        Question {index + 1}
                        <span className="badge bg-secondary ms-2">
                          {question.type.replace("_", " ")}
                        </span>
                        {autoGradeable && (
                          <span className="badge bg-info ms-1">
                            Auto-gradeable
                          </span>
                        )}
                      </h6>
                      <span className="badge bg-primary">
                        {earned}/{possible} pts
                      </span>
                    </div>

                    <div className="mb-3">
                      <strong>Question:</strong>
                      <p className="mt-1">{question.question}</p>
                    </div>

                    {answer && <div>{getAnswerDisplay(question, answer)}</div>}

                    {!answer && (
                      <div className="text-danger">
                        <em>No answer provided</em>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;
