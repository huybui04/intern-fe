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
        setAssignments(assignmentsRes.rowData || []);
        setRelatedCourses(relatedRes.data.rows || []);
        // Check if current user is enrolled
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const studentId = user.userId || user._id || user.id;
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
              <ul>
                {lessons.map((lesson: any) => (
                  <li key={lesson._id}>{lesson.title}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {tab === "assignments" && (
          <div>
            <h4>{t("courseDetail.tabs.assignments")}</h4>
            {assignments.length === 0 ? (
              <div>{t("courseDetail.noAssignments")}</div>
            ) : (
              <ul>
                {assignments.map((assignment: any) => (
                  <li key={assignment._id}>{assignment.title}</li>
                ))}
              </ul>
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
                    <div className="card h-100">
                      <img
                        src={rc.thumbnailUrl}
                        className="card-img-top"
                        alt={rc.title}
                      />
                      <div className="card-body">
                        <h5 className="card-title">{rc.title}</h5>
                        <p className="card-text">{rc.instructorName}</p>
                        <p className="card-text">${rc.price}</p>
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
