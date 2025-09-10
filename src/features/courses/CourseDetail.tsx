import React, { useEffect, useState, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getCourseDetail,
  enrollInCourse,
  getRelatedCourses,
} from "../../api/course";
import axiosInstance from "../../api/axiosInstance";
import { getLessonsByCourse } from "../../api/lesson";
import { getAssignmentsByCourse } from "../../api/assignment";
import { Course } from "../../types/course";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"lessons" | "assignments" | "related">(
    "lessons"
  );
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobMsg, setJobMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);
  // const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  const { t } = useTranslation();
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) return;
        const [courseRes, lessonsRes, assignmentsRes, relatedRes] =
          await Promise.all([
            getCourseDetail(id),
            getLessonsByCourse({ courseId: id }),
            getAssignmentsByCourse(id),
            getRelatedCourses(id),
          ]);
        setCourse(courseRes.data);
        setLessons(lessonsRes.rowData || []);
        setAssignments(assignmentsRes.data?.rows || []);
        setRelatedCourses(relatedRes.data.rows || []);
        // Check if current user is enrolled
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const studentId = user.userId || user._id || user.id;
            const role = user.role;
            
            // Set user role
            setUserRole(role);
            
            if (
              courseRes.data.enrolledStudents &&
              Array.isArray(courseRes.data.enrolledStudents) &&
              courseRes.data.enrolledStudents.some(
                (s: any) => s.studentId === studentId
              )
            ) {
              setAlreadyEnrolled(true);
            } else {
              setAlreadyEnrolled(false);
            }
          } catch {}
        }
      } catch (err: any) {
        setError(t("courseDetail.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleEnroll = async () => {
    if (!id) return;
    setEnrolling(true);
    setJobStatus(null);
    setJobMsg(null);
    try {
      const res = await enrollInCourse(id);
      const jobId = res?.data?.jobId || res?.data?.data?.jobId;
      if (jobId) {
        setJobStatus("waiting");
        // Polling function
        const pollJob = async () => {
          try {
            const jobRes = await axiosInstance.get(
              `/courses/queue/job/${jobId}`
            );
            const jobData = jobRes.data?.data;
            const jobMsg = jobRes.data?.message;
            setJobStatus(jobData?.status || null);
            setJobMsg(jobMsg || null);
            if (jobData?.status === "completed") {
              if (jobData?.result?.success) {
                toast.success(jobMsg || "Enroll success!");
                setTimeout(() => navigate("/dashboard/student"), 1200);
              } else {
                toast.error(
                  jobData?.result?.error || jobMsg || "Enroll failed."
                );
              }
              if (pollingRef.current) clearInterval(pollingRef.current);
              setEnrolling(false);
            } else if (jobData?.status === "failed") {
              toast.error(jobMsg || "Enroll failed.");
              if (pollingRef.current) clearInterval(pollingRef.current);
              setEnrolling(false);
            }
          } catch (e) {
            setJobStatus("failed");
            setJobMsg("Error polling job status.");
            if (pollingRef.current) clearInterval(pollingRef.current);
            setEnrolling(false);
          }
        };
        pollJob();
        pollingRef.current = setInterval(pollJob, 2000);
      } else {
        toast.success(res?.message || "Enroll success!");
        setTimeout(() => navigate("/dashboard/student"), 1200);
      }
    } catch (err: any) {
      toast.error("Enroll failed.");
      setEnrolling(false);
    }
  };

  if (loading) return <div>{t("common.loading")}</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!course) return null;

  return (
    <div className="container py-5">
      {/* {jobStatus && (
        <div className="mb-3">
          {jobStatus === "waiting" || jobStatus === "active" ? (
            <span className="text-info">{t("courseDetail.jobProcessing")}</span>
          ) : jobStatus === "completed" ? (
            <span className="text-success">{jobMsg || t("courseDetail.jobCompleted")}</span>
          ) : jobStatus === "failed" ? (
            <span className="text-danger">{jobMsg || t("courseDetail.jobFailed")}</span>
          ) : null}
        </div>
      )} */}
      {/* Banner */}
      <div className="card mb-4 p-4">
        <div className="row align-items-center">
          <div className="col-md-4">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="img-fluid rounded"
            />
          </div>
          <div className="col-md-8">
            <h2>{course.title}</h2>
            <p className="mb-1">
              <strong>{t("courseDetail.instructor")}:</strong>{" "}
              {course.instructorName}
            </p>
            <p className="mb-1">
              <strong>{t("courseDetail.rating")}:</strong>{" "}
              {course.rating ?? "-"}
            </p>
            <p className="mb-1">
              <strong>{t("courseDetail.category")}:</strong> {course.category}
            </p>
            <p className="mb-1">
              <strong>{t("courseDetail.difficulty")}:</strong>{" "}
              {t(`course.difficulty.${course.difficulty}`)}
            </p>
            <p className="mb-1">
              <strong>{t("courseDetail.duration")}:</strong> {course.duration}{" "}
              {t("course.hour")}
            </p>
            <p className="mb-1">
              <strong>{t("courseDetail.price")}:</strong> ${course.price}
            </p>
            {userRole === "student" ? (
              <button
                className="btn btn-primary mt-3"
                onClick={handleEnroll}
                disabled={enrolling || alreadyEnrolled}
              >
                {alreadyEnrolled
                  ? t("courseDetail.enrolled")
                  : enrolling
                  ? t("courseDetail.enrolling")
                  : t("courseDetail.enroll")}
              </button>
            ) : (
              <button
                className="btn btn-secondary mt-3"
                disabled
                title={userRole ? `${userRole}s cannot enroll in courses` : "Please login as a student to enroll"}
              >
                {userRole
                  ? "Enroll"
                  : "Login to Enroll"}
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link${tab === "lessons" ? " active" : ""}`}
            onClick={() => setTab("lessons")}
          >
            {t("courseDetail.tabs.lessons")}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${tab === "assignments" ? " active" : ""}`}
            onClick={() => setTab("assignments")}
          >
            {t("courseDetail.tabs.assignments")}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link${tab === "related" ? " active" : ""}`}
            onClick={() => setTab("related")}
          >
            {t("courseDetail.tabs.related")}
          </button>
        </li>
      </ul>
      <div>
        {tab === "lessons" && (
          <div>
            <h4>{t("courseDetail.tabs.lessons")}</h4>
            {lessons.length === 0 ? (
              <div>{t("courseDetail.noLessons")}</div>
            ) : (
              <div className="list-group">
                {lessons.map((lesson: any, idx: number) => (
                  <button
                    key={lesson._id}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => navigate(`/lessons/${lesson._id}`)}
                  >
                    <div>
                      <span className="fw-bold me-2">{idx + 1}.</span>
                      {lesson.title}
                      {lesson.duration ? (
                        <span className="badge bg-secondary ms-2">
                          {lesson.duration} {t("course.hour")}
                        </span>
                      ) : null}
                    </div>
                    {lesson.hasAssignment && (
                      <span className="badge bg-info ms-2">Quiz</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "assignments" && (
          <div>
            <h4>{t("courseDetail.tabs.assignments")}</h4>
            {assignments.length === 0 ? (
              <div>{t("courseDetail.noAssignments")}</div>
            ) : (
              <div className="row">
                {assignments.map((assignment: any) => (
                  <div
                    key={assignment.id || assignment._id}
                    className="col-md-6 col-lg-4 mb-3"
                  >
                    <div className="card h-100">
                      <div className="card-body">
                        <h5 className="card-title">{assignment.title}</h5>
                        <p className="card-text text-muted small">
                          {assignment.description &&
                          assignment.description.length > 100
                            ? `${assignment.description.substring(0, 100)}...`
                            : assignment.description || "No description"}
                        </p>

                        <div className="small text-muted mb-3">
                          {assignment.totalPoints && (
                            <div>
                              <strong>Points:</strong> {assignment.totalPoints}
                            </div>
                          )}
                          {assignment.questions && (
                            <div>
                              <strong>Questions:</strong>{" "}
                              {assignment.questions.length}
                            </div>
                          )}
                          {assignment.timeLimit && (
                            <div>
                              <strong>Time Limit:</strong>{" "}
                              {assignment.timeLimit} minutes
                            </div>
                          )}
                          {assignment.dueDate && (
                            <div>
                              <strong>Due:</strong>{" "}
                              {new Date(
                                assignment.dueDate
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card-footer">
                        {userRole === "student" ? (
                          alreadyEnrolled ? (
                            <button
                              className="btn btn-primary w-100"
                              onClick={() =>
                                navigate(
                                  `/assignments/${
                                    assignment.id || assignment._id
                                  }`
                                )
                              }
                            >
                              {t("assignment.startAssignment")}
                            </button>
                          ) : (
                            <button className="btn btn-secondary w-100" disabled>
                              {t("courseDetail.enroll")} to access
                            </button>
                          )
                        ) : (
                          <button 
                            className="btn btn-secondary w-100" 
                            disabled
                            title={userRole ? `${userRole}s cannot access assignments` : "Please login to access assignments"}
                          >
                            {userRole 
                              ? `Enroll to access`
                              : "Login to access"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "related" && (
          <div>
            <h4>{t("courseDetail.tabs.related")}</h4>
            {relatedCourses.length === 0 ? (
              <div>{t("courseDetail.noRelated")}</div>
            ) : (
              <div className="row">
                {relatedCourses.map((rc) => (
                  <div key={rc._id} className="col-md-4 mb-3">
                    <div 
                      className="card h-100"
                      style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                      onClick={() => navigate(`/courses/${rc._id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <img
                        src={rc.thumbnailUrl}
                        className="card-img-top"
                        alt={rc.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{rc.title}</h5>
                        <p className="card-text text-muted mb-2">{rc.instructorName}</p>
                        <div className="mt-auto d-flex justify-content-between align-items-center">
                          <span className="h6 text-primary mb-0">${rc.price}</span>
                          <small className="text-muted">
                            {rc.difficulty && (
                              <span className={`badge ${
                                rc.difficulty === "beginner"
                                  ? "bg-success"
                                  : rc.difficulty === "intermediate"
                                  ? "bg-warning"
                                  : "bg-danger"
                              }`}>
                                {t(`course.difficulty.${rc.difficulty}`)}
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <ToastContainer position="top-center" autoClose={2000} />
    </div>
  );
};

export default CourseDetail;
