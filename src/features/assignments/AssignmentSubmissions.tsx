import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Assignment, Submission } from "../../types/assignment";
import {
  getAssignmentDetail,
  getAssignmentSubmissions,
  gradeSubmission,
  autoGradeSubmission,
} from "../../api/assignment";
import "./AssignmentGrading.css";

interface SubmissionWithStudent extends Submission {
  studentName?: string;
  studentEmail?: string;
}

const AssignmentSubmissions: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { t } = useTranslation();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [autoGrading, setAutoGrading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
      fetchSubmissions();
    }
  }, [assignmentId]);

  const fetchAssignmentData = async () => {
    try {
      const res = await getAssignmentDetail(assignmentId!);
      const assignmentData = (res as any).data || res;
      setAssignment(assignmentData);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      toast.error("Error loading assignment details");
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await getAssignmentSubmissions(assignmentId!);
      const submissionsData = (res as any).data || res;
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Error loading submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleManualGrade = async (
    submissionId: string,
    grade: number,
    feedback?: string
  ) => {
    setGrading(submissionId);
    try {
      await gradeSubmission(submissionId, { grade, feedback });
      toast.success("Submission graded successfully");
      fetchSubmissions(); // Refresh submissions
    } catch (error) {
      console.error("Error grading submission:", error);
      toast.error("Error grading submission");
    } finally {
      setGrading(null);
    }
  };

  const handleAutoGradeAll = async () => {
    if (!assignment || autoGrading) return;

    // Check if assignment has auto-gradeable questions
    const autoGradeableQuestions = assignment.questions?.filter(
      (q) => q.type === "multiple_choice" || q.type === "true_false"
    );

    if (!autoGradeableQuestions || autoGradeableQuestions.length === 0) {
      toast.warning("This assignment has no auto-gradeable questions");
      return;
    }

    const unGradedSubmissions = submissions.filter(
      (s) => s.status === "submitted"
    );

    if (unGradedSubmissions.length === 0) {
      toast.info("No ungraded submissions to auto-grade");
      return;
    }

    setAutoGrading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Get instructor ID from localStorage or auth context
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const instructorId = user.id || user._id;

      if (!instructorId) {
        toast.error("Instructor ID not found. Please log in again.");
        return;
      }

      for (const submission of unGradedSubmissions) {
        try {
          await autoGradeSubmission(submission.id, instructorId);
          successCount++;
        } catch (error) {
          console.error(
            `Error auto-grading submission ${submission.id}:`,
            error
          );
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully auto-graded ${successCount} submissions`);
        fetchSubmissions(); // Refresh submissions
      }

      if (errorCount > 0) {
        toast.warning(`Failed to auto-grade ${errorCount} submissions`);
      }
    } catch (error) {
      console.error("Error during auto-grading:", error);
      toast.error("Error during auto-grading process");
    } finally {
      setAutoGrading(false);
    }
  };

  const handleAutoGradeSingle = async (submissionId: string) => {
    if (!assignment || grading === submissionId) return;

    // Check if assignment has auto-gradeable questions
    const autoGradeableQuestions = assignment.questions?.filter(
      (q) => q.type === "multiple_choice" || q.type === "true_false"
    );

    if (!autoGradeableQuestions || autoGradeableQuestions.length === 0) {
      toast.warning("This assignment has no auto-gradeable questions");
      return;
    }

    setGrading(submissionId);

    try {
      // Get instructor ID from localStorage or auth context
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const instructorId = user.id || user._id;

      if (!instructorId) {
        toast.error("Instructor ID not found. Please log in again.");
        return;
      }

      await autoGradeSubmission(submissionId, instructorId);
      toast.success("Submission auto-graded successfully");
      fetchSubmissions(); // Refresh submissions
    } catch (error) {
      console.error("Error auto-grading submission:", error);
      toast.error("Error auto-grading submission");
    } finally {
      setGrading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { class: "bg-warning", label: "Submitted" },
      graded: { class: "bg-success", label: "Graded" },
      late: { class: "bg-danger", label: "Late" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      class: "bg-secondary",
      label: status,
    };

    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateAutoGradeablePoints = () => {
    if (!assignment?.questions) return 0;
    return assignment.questions
      .filter((q) => q.type === "multiple_choice" || q.type === "true_false")
      .reduce((total, q) => total + q.points, 0);
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

  if (!assignment) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">Assignment not found</div>
      </div>
    );
  }

  const autoGradeablePoints = calculateAutoGradeablePoints();
  const hasAutoGradeableQuestions = autoGradeablePoints > 0;

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">{assignment.title}</h2>
              <p className="text-muted mb-0">
                Assignment Submissions ({submissions.length} total)
              </p>
            </div>
            <div>
              <Link
                to={`/assignments/${assignmentId}`}
                className="btn btn-outline-primary me-2"
              >
                <i className="fas fa-eye me-1"></i>
                View Assignment
              </Link>
              {hasAutoGradeableQuestions && (
                <button
                  className="btn btn-success"
                  onClick={handleAutoGradeAll}
                  disabled={
                    autoGrading ||
                    submissions.filter((s) => s.status === "submitted")
                      .length === 0
                  }
                >
                  {autoGrading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Auto-Grading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic me-1"></i>
                      Auto-Grade All
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Assignment Info */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <strong>Total Points:</strong> {assignment.totalPoints}
                </div>
                <div className="col-md-3">
                  <strong>Total Questions:</strong>{" "}
                  {assignment.questions?.length || 0}
                </div>
                <div className="col-md-3">
                  <strong>Auto-Gradeable Points:</strong> {autoGradeablePoints}
                </div>
                <div className="col-md-3">
                  <strong>Due Date:</strong>{" "}
                  {assignment.dueDate
                    ? formatDateTime(assignment.dueDate)
                    : "No due date"}
                </div>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 ? (
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              No submissions found for this assignment.
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Submissions</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Student</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <tr key={submission.id}>
                          <td>
                            <div>
                              <strong>
                                {submission.studentName || "Unknown Student"}
                              </strong>
                              {submission.studentEmail && (
                                <div className="text-muted small">
                                  {submission.studentEmail}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{formatDateTime(submission.submittedAt)}</td>
                          <td>{getStatusBadge(submission.status)}</td>
                          <td>
                            {submission.score !== undefined ? (
                              <span className="fw-bold">
                                {submission.score}/{assignment.totalPoints}
                              </span>
                            ) : (
                              <span className="text-muted">Not graded</span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link
                                to={`/assignments/${assignmentId}/submissions/${submission.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="fas fa-eye me-1"></i>
                                View
                              </Link>
                              {submission.status === "submitted" &&
                                hasAutoGradeableQuestions && (
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() =>
                                      handleAutoGradeSingle(submission.id)
                                    }
                                    disabled={grading === submission.id}
                                  >
                                    {grading === submission.id ? (
                                      <span className="spinner-border spinner-border-sm"></span>
                                    ) : (
                                      <>
                                        <i className="fas fa-magic me-1"></i>
                                        Auto-Grade
                                      </>
                                    )}
                                  </button>
                                )}
                              <button
                                className="btn btn-sm btn-outline-warning"
                                data-bs-toggle="modal"
                                data-bs-target={`#gradeModal${submission.id}`}
                              >
                                <i className="fas fa-edit me-1"></i>
                                Grade
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Modals */}
      {submissions.map((submission) => (
        <GradeModal
          key={submission.id}
          submission={submission}
          assignment={assignment}
          onGrade={handleManualGrade}
          loading={grading === submission.id}
        />
      ))}
    </div>
  );
};

// Grade Modal Component
interface GradeModalProps {
  submission: SubmissionWithStudent;
  assignment: Assignment;
  onGrade: (submissionId: string, grade: number, feedback?: string) => void;
  loading: boolean;
}

const GradeModal: React.FC<GradeModalProps> = ({
  submission,
  assignment,
  onGrade,
  loading,
}) => {
  const [grade, setGrade] = useState(submission.score || 0);
  const [feedback, setFeedback] = useState(submission.feedback || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGrade(submission.id, grade, feedback);
    // Close modal
    const modal = document.getElementById(`gradeModal${submission.id}`);
    if (modal) {
      const modalInstance = (window as any).bootstrap.Modal.getInstance(modal);
      modalInstance?.hide();
    }
  };

  return (
    <div
      className="modal fade"
      id={`gradeModal${submission.id}`}
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Grade Submission - {submission.studentName || "Unknown Student"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="grade" className="form-label">
                  Score (out of {assignment.totalPoints})
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="grade"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  min={0}
                  max={assignment.totalPoints}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="feedback" className="form-label">
                  Feedback (optional)
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
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Grading...
                  </>
                ) : (
                  "Save Grade"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissions;
