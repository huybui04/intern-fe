import React from "react";
import { Assignment, Answer } from "../../types/assignment";
import { autoGradeSubmission, QuestionResult } from "../../utils/autoGrading";

interface AutoGradeResultsProps {
  assignment: Assignment;
  answers: Answer[];
  show: boolean;
  onClose: () => void;
}

const AutoGradeResults: React.FC<AutoGradeResultsProps> = ({
  assignment,
  answers,
  show,
  onClose,
}) => {
  if (!show) return null;

  const gradeResult = autoGradeSubmission(assignment, answers);
  const percentage = (gradeResult.score / gradeResult.maxScore) * 100;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-success";
    if (percentage >= 80) return "text-info";
    if (percentage >= 70) return "text-warning";
    return "text-danger";
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return "🎉";
    if (percentage >= 80) return "👍";
    if (percentage >= 70) return "📚";
    if (percentage >= 60) return "💪";
    return "🤝";
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-chart-line me-2"></i>
              Auto-Grading Results
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body">
            {/* Overall Score */}
            <div className="text-center mb-4">
              <div className={`display-4 fw-bold ${getScoreColor(percentage)}`}>
                {gradeResult.score}/{gradeResult.maxScore}
              </div>
              <div className="h5 text-muted">
                {percentage.toFixed(1)}% {getPerformanceIcon(percentage)}
              </div>

              {/* Score Breakdown */}
              <div className="row mt-3">
                <div className="col-md-6">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <i className="fas fa-robot text-success fa-2x mb-2"></i>
                      <div className="h6">Auto-Graded</div>
                      <div className="fw-bold text-success">
                        {
                          gradeResult.questionResults.filter(
                            (q) => q.isAutoGradeable && q.isCorrect
                          ).length
                        }
                        /
                        {
                          gradeResult.questionResults.filter(
                            (q) => q.isAutoGradeable
                          ).length
                        }
                      </div>
                      <small className="text-muted">questions correct</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <i className="fas fa-user-edit text-warning fa-2x mb-2"></i>
                      <div className="h6">Manual Review</div>
                      <div className="fw-bold text-warning">
                        {
                          gradeResult.questionResults.filter(
                            (q) => !q.isAutoGradeable
                          ).length
                        }
                      </div>
                      <small className="text-muted">essay questions</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Progress</span>
                <span className="text-muted">{percentage.toFixed(1)}%</span>
              </div>
              <div className="progress" style={{ height: "8px" }}>
                <div
                  className={`progress-bar ${
                    percentage >= 90
                      ? "bg-success"
                      : percentage >= 80
                      ? "bg-info"
                      : percentage >= 70
                      ? "bg-warning"
                      : "bg-danger"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Question-by-Question Results */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">
                <i className="fas fa-list-check me-2"></i>
                Question Results
              </h6>

              {gradeResult.questionResults.map((result, index) => (
                <div key={result.questionId} className="card mb-2">
                  <div className="card-body py-2">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <span className="badge bg-secondary me-2">
                            Q{index + 1}
                          </span>
                          <small className="text-truncate">
                            {result.questionText.substring(0, 50)}
                            {result.questionText.length > 50 ? "..." : ""}
                          </small>
                        </div>
                      </div>
                      <div className="col-md-2 text-center">
                        <span
                          className={`badge ${
                            result.questionType === "essay"
                              ? "bg-warning"
                              : result.questionType === "multiple_choice"
                              ? "bg-info"
                              : "bg-primary"
                          }`}
                        >
                          {result.questionType.replace("_", " ")}
                        </span>
                      </div>
                      <div className="col-md-2 text-center">
                        {result.isAutoGradeable ? (
                          result.isCorrect ? (
                            <i className="fas fa-check-circle text-success fa-lg"></i>
                          ) : (
                            <i className="fas fa-times-circle text-danger fa-lg"></i>
                          )
                        ) : (
                          <i
                            className="fas fa-clock text-warning fa-lg"
                            title="Pending manual review"
                          ></i>
                        )}
                      </div>
                      <div className="col-md-2 text-center">
                        <span className="fw-bold">
                          {result.pointsEarned}/{result.maxPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            {gradeResult.feedback && (
              <div className="alert alert-info">
                <i className="fas fa-comment-alt me-2"></i>
                <strong>Feedback:</strong>
                <div className="mt-2" style={{ whiteSpace: "pre-line" }}>
                  {gradeResult.feedback}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              <i className="fas fa-check me-2"></i>
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoGradeResults;
