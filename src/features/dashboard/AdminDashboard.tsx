import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { getCourses } from "../../api/course";
import { getUsers } from "../../api/user";
import { getAssignmentsByCourse } from "../../api/assignment";

function WidgetCard({
  icon,
  title,
  value,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description?: string;
  color?: string;
}) {
  return (
    <div className={`card mb-3 border-0 shadow-sm ${color || ""}`.trim()}>
      <div className="card-body d-flex flex-column align-items-start">
        <div className="d-flex align-items-center mb-2">
          <span className="fs-2 me-2">{icon}</span>
          <span className="fw-semibold fs-5">{title}</span>
        </div>
        <div className="display-6 fw-bold text-dark">{value}</div>
        {description && (
          <div className="text-muted small mt-1">{description}</div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { t } = useTranslation();
  const [courseCount, setCourseCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [assignmentCount, setAssignmentCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getCourses(), getUsers()])
      .then(async ([coursesRes, usersRes]) => {
        setCourseCount(coursesRes.data.rows.length);
        setUserCount(usersRes.rowCount);
        // Đếm tổng số assignment của tất cả course
        let totalAssignments = 0;
        const courseList = coursesRes.data.rows;
        if (courseList.length > 0) {
          const assignmentCounts = await Promise.all(
            courseList.map((c: any) =>
              getAssignmentsByCourse(c._id).then((res) => res.rowCount)
            )
          );
          totalAssignments = assignmentCounts.reduce((a, b) => a + b, 0);
        }
        setAssignmentCount(totalAssignments);
      })
      .catch(() => {
        setError(t("dashboard.loadError"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 bg-light p-0">
          <div className="d-flex flex-column p-3">
            <h5 className="mb-4">{t("Admin Dashboard")}</h5>
            <nav className="nav flex-column">
              <a className="nav-link" href="/users">
                👥 {t("Manage Users")}
              </a>
              <a className="nav-link" href="/courses">
                📚 {t("Manage Courses")}
              </a>
              <a className="nav-link" href="#stats">
                📊 {t("Statistics")}
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          <div className="p-4">
            <h2 className="text-3xl font-bold mb-8 text-blue-700 flex items-center gap-2">
              <span className="inline-block">👑</span>{" "}
              {t("dashboard.adminTitle")}
            </h2>
            {loading ? (
              <div className="text-center text-lg text-blue-600 py-8">
                {t("dashboard.loading")}
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : (
              <div className="row g-4">
                <div className="col-md-4">
                  <WidgetCard
                    icon={<span>📚</span>}
                    title={t("dashboard.totalCourses")}
                    value={courseCount ?? "-"}
                    description={t("dashboard.totalCoursesDesc")}
                    color="border-blue-500"
                  />
                </div>
                <div className="col-md-4">
                  <WidgetCard
                    icon={<span>🧑‍🤝‍🧑</span>}
                    title={t("dashboard.totalUsers")}
                    value={userCount ?? "-"}
                    description={t("dashboard.totalUsersDesc")}
                    color="border-green-500"
                  />
                </div>
                <div className="col-md-4">
                  <WidgetCard
                    icon={<span>📝</span>}
                    title={t("dashboard.totalAssignments")}
                    value={assignmentCount ?? "-"}
                    description={t("dashboard.totalAssignmentsDesc")}
                    color="border-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
