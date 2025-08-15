import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCourses } from "../../api/course";
import { Course } from "../../types/course";

const InstructorDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      // TODO: Implement API call for instructor's courses
      // const response = await getInstructorCourses();
      const response = await getCourses({ limit: 5 }); // Temporary
      setMyCourses(response.data.rows);
    } catch (error) {
      console.error("Error fetching my courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 bg-light p-0">
          <div className="d-flex flex-column p-3">
            <h5 className="mb-4">{t("Instructor Dashboard")}</h5>
            <nav className="nav flex-column">
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "courses" ? "active" : ""
                }`}
                onClick={() => setActiveTab("courses")}
              >
                📚 {t("My Courses")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "lessons" ? "active" : ""
                }`}
                onClick={() => setActiveTab("lessons")}
              >
                📖 {t("Manage Lessons")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "assignments" ? "active" : ""
                }`}
                onClick={() => setActiveTab("assignments")}
              >
                📝 {t("Manage Assignments")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "stats" ? "active" : ""
                }`}
                onClick={() => setActiveTab("stats")}
              >
                📊 {t("Statistics")}
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          <div className="p-4">
            {activeTab === "courses" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>{t("My Courses")}</h2>
                  <Link to="/courses/create" className="btn btn-primary">
                    {t("Create New Course")}
                  </Link>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row g-4">
                    {myCourses.length === 0 ? (
                      <div className="col-12">
                        <div className="text-center py-5">
                          <h5>{t("No courses created yet")}</h5>
                          <p className="text-muted">
                            {t("Start by creating your first course")}
                          </p>
                          <Link
                            to="/courses/create"
                            className="btn btn-primary"
                          >
                            {t("Create Course")}
                          </Link>
                        </div>
                      </div>
                    ) : (
                      myCourses.map((course) => (
                        <div key={course._id} className="col-lg-4 col-md-6">
                          <div className="card h-100">
                            <img
                              src={
                                course.thumbnailUrl ||
                                "/api/placeholder/300/200"
                              }
                              className="card-img-top"
                              alt={course.title}
                              style={{ height: "200px", objectFit: "cover" }}
                            />
                            <div className="card-body d-flex flex-column">
                              <h5 className="card-title">{course.title}</h5>
                              <p className="card-text text-muted flex-grow-1">
                                {course.description?.substring(0, 100)}...
                              </p>
                              <div className="d-flex justify-content-between text-muted small mb-3">
                                <span>{t("Students")}: 25</span>
                                <span>
                                  {t("Difficulty")}: {course.difficulty}
                                </span>
                              </div>
                              <div className="mt-auto d-flex gap-2">
                                <Link
                                  to={`/courses/${course._id}/edit`}
                                  className="btn btn-outline-primary flex-fill"
                                >
                                  {t("Edit")}
                                </Link>
                                <Link
                                  to={`/courses/${course._id}`}
                                  className="btn btn-primary flex-fill"
                                >
                                  {t("View")}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "lessons" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>{t("Manage Lessons")}</h2>
                  <Link to="/lessons/create" className="btn btn-primary">
                    {t("Create New Lesson")}
                  </Link>
                </div>
                <div className="card">
                  <div className="card-body">
                    <p className="text-muted">
                      {t("Select a course to manage its lessons")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assignments" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>{t("Manage Assignments")}</h2>
                  <Link to="/assignments/create" className="btn btn-primary">
                    {t("Create New Assignment")}
                  </Link>
                </div>
                <div className="card">
                  <div className="card-body">
                    <p className="text-muted">
                      {t("Recent assignment submissions and grading")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "stats" && (
              <div>
                <h2 className="mb-4">{t("Course Statistics")}</h2>
                <div className="row g-4">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-primary">12</h3>
                        <p className="card-text">{t("Total Courses")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-success">150</h3>
                        <p className="card-text">{t("Total Students")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-info">45</h3>
                        <p className="card-text">{t("Assignments")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-warning">85%</h3>
                        <p className="card-text">{t("Completion Rate")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
