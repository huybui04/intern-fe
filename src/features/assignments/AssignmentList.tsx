import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Assignment } from "../../types/assignment";
import { getAssignmentsByCourse } from "../../api/assignment";

const AssignmentList: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useTranslation();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const data = await getAssignmentsByCourse(courseId!);
      setAssignments(data.data?.rows || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;

    if (!assignment.isPublished) {
      return (
        <span className="badge bg-secondary">
          {t("assignment.status.draft") || "Draft"}
        </span>
      );
    }

    if (dueDate && now > dueDate) {
      return (
        <span className="badge bg-danger">
          {t("assignment.status.overdue") || "Overdue"}
        </span>
      );
    }

    return (
      <span className="badge bg-success">
        {t("assignment.status.available") || "Available"}
      </span>
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

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{t("assignment.assignments") || "Assignments"}</h2>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center">
          <div className="alert alert-info">
            {t("assignment.noAssignments") ||
              "No assignments found for this course"}
          </div>
        </div>
      ) : (
        <div className="row">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{assignment.title}</h5>
                    {getStatusBadge(assignment)}
                  </div>

                  <p className="card-text text-muted small mb-3">
                    {assignment.description.length > 100
                      ? `${assignment.description.substring(0, 100)}...`
                      : assignment.description}
                  </p>

                  <div className="small text-muted mb-3">
                    <div className="row">
                      <div className="col-6">
                        <strong>{t("assignment.points")}:</strong>{" "}
                        {assignment.totalPoints}
                      </div>
                      <div className="col-6">
                        <strong>{t("assignment.questions")}:</strong>{" "}
                        {assignment.questions.length}
                      </div>
                      {assignment.timeLimit && (
                        <div className="col-12 mt-1">
                          <strong>{t("assignment.timeLimit")}:</strong>{" "}
                          {assignment.timeLimit} {t("assignment.minutes")}
                        </div>
                      )}
                      {assignment.dueDate && (
                        <div className="col-12 mt-1">
                          <strong>{t("assignment.dueDate")}:</strong>{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  {assignment.isPublished ? (
                    <Link
                      to={`/assignments/${assignment.id}`}
                      className="btn btn-primary w-100"
                    >
                      {t("assignment.startAssignment") || "Làm bài tập"}
                    </Link>
                  ) : (
                    <button className="btn btn-secondary w-100" disabled>
                      {t("assignment.notPublished") || "Not Published"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
