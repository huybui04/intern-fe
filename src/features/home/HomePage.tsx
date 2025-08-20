import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCourses, getPublishedCourses } from "../../api/course";
import { Course } from "../../types/course";
import { useTranslation } from "react-i18next";

const HomePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [totalRows, setTotalRows] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const fetchCourses = async (searchValue = "", pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const startRow = (pageNum - 1) * pageSize;
      const endRow = pageNum * pageSize;
      const filterModel: any = {
        isPublished: {
          filterType: "boolean",
          type: "equals",
          filter: isPublished,
        },
      };

      if (searchValue) {
        filterModel.description = {
          filterType: "text",
          type: "contains",
          filter: searchValue,
        };
      }
      if (difficulty) {
        filterModel.difficulty = {
          filterType: "text",
          type: "equals",
          filter: difficulty,
        };
      }
      if (category) {
        filterModel.category = {
          filterType: "text",
          type: "equals",
          filter: category,
        };
      }
      const payload = {
        startRow,
        endRow,
        filterModel,
        // sortModel: [{ colId: "title", sort: "asc" }],
      };
      const res = await getCourses(payload);
      setCourses(res.data.rows || []);
      setTotalRows(res.rowCount || 0);
    } catch (err: any) {
      setError(t("courseList.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  // Gọi lại khi đổi page
  useEffect(() => {
    fetchCourses(search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchCourses(search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCourses(search, 1);
  };

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="hero-section text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">{t("homePage.title")}</h1>
        <p className="lead mb-4">{t("homePage.subtitle")}</p>
        <div className="row justify-content-center">
          <div className="col-md-10">
            <form
              className="row g-2 align-items-center justify-content-center"
              onSubmit={handleSearch}
            >
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("homePage.searchPlaceholder")}
                  aria-label="Search courses"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="">{t("course.difficulty.all")}</option>
                  <option value="beginner">
                    {t("course.difficulty.beginner")}
                  </option>
                  <option value="intermediate">
                    {t("course.difficulty.intermediate")}
                  </option>
                  <option value="advanced">
                    {t("course.difficulty.advanced")}
                  </option>
                </select>
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("course.category")}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" type="submit">
                  <i className="fas fa-search"></i> {t("common.search")}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Course Cards */}
      <div className="courses-section">
        <h2 className="h3 mb-4">{t("homePage.popularCourses")}</h2>
        {loading ? (
          <div>{t("common.loading")}</div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : (
          <>
            <div className="row">
              {courses.map((course) => (
                <div key={course._id} className="col-lg-4 col-md-6 mb-4">
                  <div className="card h-100 shadow-sm">
                    <img
                      src={course.thumbnailUrl}
                      className="card-img-top"
                      alt={course.title}
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body d-flex flex-column">
                      <div className="mb-2">
                        <span
                          className={`badge ${
                            course.difficulty === "beginner"
                              ? "bg-success"
                              : course.difficulty === "intermediate"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                        >
                          {course.difficulty === "beginner"
                            ? t("course.difficulty.beginner")
                            : course.difficulty === "intermediate"
                            ? t("course.difficulty.intermediate")
                            : t("course.difficulty.advanced")}
                        </span>
                      </div>
                      <h5 className="card-title">{course.title}</h5>
                      <p className="card-text text-muted flex-grow-1">
                        {course.description}
                      </p>
                      <div className="course-meta mb-3">
                        <small className="text-muted d-block">
                          <i className="fas fa-user me-1"></i>
                          {course.instructorName}
                        </small>
                        <small className="text-muted d-block">
                          <i className="fas fa-tag me-1"></i>
                          {course.category}
                        </small>
                        <small className="text-muted d-block">
                          <i className="fas fa-clock me-1"></i>
                          {course.duration} {t("course.hour")}
                        </small>
                        <div className="d-flex align-items-center mt-2">
                          <div className="me-3">
                            <i className="fas fa-star text-warning me-1"></i>
                            <small>{course.rating ?? "-"}</small>
                          </div>
                          <div>
                            <i className="fas fa-users text-muted me-1"></i>
                            <small>
                              {course.studentsCount ?? 0} {t("course.students")}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="price">
                          <span className="h5 text-primary fw-bold">
                            ${course.price}
                          </span>
                        </div>
                        <Link
                          to={`/courses/${course._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          {t("homePage.detailButton")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalRows > pageSize && (
              <nav className="d-flex justify-content-center mt-4">
                <ul className="pagination">
                  <li className={`page-item${page === 1 ? " disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      &laquo;
                    </button>
                  </li>
                  {Array.from(
                    { length: Math.ceil(totalRows / pageSize) },
                    (_, i) => (
                      <li
                        key={i + 1}
                        className={`page-item${
                          page === i + 1 ? " active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    )
                  )}
                  <li
                    className={`page-item${
                      page === Math.ceil(totalRows / pageSize)
                        ? " disabled"
                        : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page === Math.ceil(totalRows / pageSize)}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
