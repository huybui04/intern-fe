import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  getCoursesGrid,
  getCourses,
  deleteCourse,
  createCourse,
  updateCourse,
} from "../../api/course";
import {
  getLessonsByCourse,
  deleteLesson,
  createLesson,
  updateLesson,
} from "../../api/lesson";
import {
  getAssignmentsGrid,
  deleteAssignment,
  createAssignment,
  updateAssignment,
} from "../../api/assignment";
import { Course } from "../../types/course";
import { Lesson } from "../../types/lesson";
import { Assignment } from "../../types/assignment";

// Components
import CourseForm from "./components/CourseForm";
import LessonForm from "./components/LessonForm";
import AssignmentForm from "./components/AssignmentForm";
import ConfirmDialog from "./components/ConfirmDialog";

const InstructorDashboardEnhanced: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<
    "courses" | "lessons" | "assignments" | "statistics"
  >("courses");

  // Course data and states
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Lesson data and states
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Assignment data and states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: string;
    id: string;
    name: string;
  } | null>(null);

  // Course Grid Definition
  const courseColumnDefs = useMemo(
    () => [
      {
        field: "title" as any,
        headerName: t("instructor.table.title"),
        sortable: true,
        filter: true,
        flex: 2,
      },
      {
        field: "instructorName" as any,
        headerName: t("instructor.table.instructor"),
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "category" as any,
        headerName: t("instructor.table.category"),
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "difficulty" as any,
        headerName: t("instructor.table.difficulty"),
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "duration" as any,
        headerName: t("instructor.table.duration"),
        sortable: true,
        valueFormatter: (params: any) => `${params.value || 0}h`,
        flex: 1,
      },
      {
        field: "price" as any,
        headerName: t("instructor.table.price"),
        sortable: true,
        valueFormatter: (params: any) => `$${params.value || 0}`,
        flex: 1,
      },
      {
        field: "studentsCount" as any,
        headerName: t("instructor.table.students"),
        sortable: false,
        valueFormatter: (params: any) => {
          const students = params.value ?? 0;
          const max =
            params.data &&
            typeof params.data.maxStudents !== "undefined" &&
            params.data.maxStudents !== null
              ? params.data.maxStudents
              : "-";
          return `${students}/${max}`;
        },
        filter: false,
        flex: 1,
      },
      {
        field: "isPublished" as any,
        headerName: t("instructor.table.published"),
        cellRenderer: (params: any) => (
          <span
            className={`badge ${params.value ? "bg-success" : "bg-danger"}`}
          >
            {params.value ? "Published" : "Draft"}
          </span>
        ),
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "actions" as any,
        headerName: t("instructor.table.actions"),
        cellRenderer: (params: any) => (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEditCourse(params.data)}
            >
              {t("instructor.table.edit")}
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteCourse(params.data)}
            >
              {t("instructor.table.delete")}
            </button>
          </div>
        ),
        flex: 1,
        sortable: false,
        filter: false,
      },
    ],
    [t]
  );

  // Lesson Grid Definition
  const lessonColumnDefs = useMemo(
    () => [
      {
        field: "title" as any,
        headerName: t("instructor.table.title"),
        sortable: true,
        filter: true,
        flex: 2,
      },
      {
        field: "duration" as any,
        headerName: t("instructor.table.duration"),
        sortable: true,
        filter: false,
        valueFormatter: (params: any) => `${params.value || 0} min`,
        flex: 1,
      },
      {
        field: "order" as any,
        headerName: "Order",
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "actions" as any,
        headerName: t("instructor.table.actions"),
        cellRenderer: (params: any) => (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEditLesson(params.data)}
            >
              {t("instructor.table.edit")}
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteLesson(params.data)}
            >
              {t("instructor.table.delete")}
            </button>
          </div>
        ),
        flex: 1,
        sortable: false,
        filter: false,
      },
    ],
    [t]
  );

  // Assignment Grid Definition
  const assignmentColumnDefs = useMemo(
    () => [
      {
        field: "title" as any,
        headerName: t("instructor.table.title"),
        sortable: true,
        filter: true,
        flex: 2,
      },
      {
        field: "dueDate" as any,
        headerName: "Due Date",
        sortable: true,
        valueFormatter: (params: any) =>
          params.value
            ? new Date(params.value).toLocaleDateString("en-GB")
            : "-",
        flex: 1,
      },
      {
        field: "totalPoints" as any,
        headerName: "Points",
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "isPublished" as any,
        headerName: t("instructor.table.published"),
        cellRenderer: (params: any) => (
          <span
            className={`badge ${params.value ? "bg-success" : "bg-danger"}`}
          >
            {params.value ? "Published" : "Draft"}
          </span>
        ),
        sortable: false,
        filter: false,
        flex: 1,
      },
      {
        field: "actions" as any,
        headerName: t("instructor.table.actions"),
        cellRenderer: (params: any) => (
          <div className="d-flex gap-1">
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() =>
                window.open(
                  `/assignments/${params.data._id}/submissions`,
                  "_blank"
                )
              }
              title={t("instructor.table.viewSubmissions")}
            >
              {/* <i className="fas fa-list"></i> */}
              {t("instructor.table.view")}
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleEditAssignment(params.data)}
            >
              {t("instructor.table.edit")}
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDeleteAssignment(params.data)}
            >
              {t("instructor.table.delete")}
            </button>
          </div>
        ),
        flex: 1,
        sortable: false,
        filter: false,
      },
    ],
    [t]
  );

  // Course datasource for AG Grid
  const coursesDataSource = useMemo(
    () => ({
      getRows: async (params: any) => {
        setCoursesLoading(true);
        try {
          const result = await getCoursesGrid({
            startRow: params.startRow,
            endRow: params.endRow,
            sortModel: params.sortModel,
            filterModel: params.filterModel,
          });

          if (result.success) {
            setCourses(result.data.rows);
            params.successCallback(result.data.rows, result.data.lastRow);
          } else {
            params.failCallback();
          }
        } catch (error) {
          console.error("Error loading courses:", error);
          params.failCallback();
          toast.error("Failed to load courses");
        } finally {
          setCoursesLoading(false);
        }
      },
    }),
    []
  );

  // Assignment datasource for AG Grid
  const assignmentsDataSource = useMemo(
    () => ({
      getRows: async (params: any) => {
        setAssignmentsLoading(true);
        try {
          console.log("Fetching assignments with params:", {
            startRow: params.startRow,
            endRow: params.endRow,
            sortModel: params.sortModel,
            filterModel: params.filterModel,
          });

          const result = await getAssignmentsGrid({
            startRow: params.startRow,
            endRow: params.endRow,
            sortModel: params.sortModel,
            filterModel: params.filterModel,
          });

          console.log("Assignments API result:", result);

          if (result.success && result.data && result.data.rows) {
            const assignments = result.data.rows;
            console.log("Setting assignments:", assignments);
            setAssignments(assignments);
            params.successCallback(
              assignments,
              result.data.lastRow || assignments.length
            );
          } else {
            console.error("Invalid result format:", result);
            params.failCallback();
            toast.error("Invalid response format from server");
          }
        } catch (error) {
          console.error("Error loading assignments:", error);
          params.failCallback();
          toast.error(
            "Failed to load assignments. Please check console for details."
          );
        } finally {
          setAssignmentsLoading(false);
        }
      },
    }),
    []
  );

  // Course CRUD handlers
  const handleAddCourse = () => {
    setEditingItem(null);
    setShowCourseForm(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingItem(course);
    setShowCourseForm(true);
  };

  const handleDeleteCourse = (course: Course) => {
    setDeleteTarget({ type: "course", id: course._id, name: course.title });
    setShowDeleteConfirm(true);
  };

  const handleSaveCourse = async (courseData: Partial<Course>) => {
    try {
      if (editingItem) {
        await updateCourse(editingItem._id, courseData);
        toast.success("Course updated successfully");
      } else {
        await createCourse(courseData);
        toast.success("Course created successfully");
      }
      setShowCourseForm(false);
      setEditingItem(null);
      // Refresh grid data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error("Failed to save course");
    }
  };

  // Lesson CRUD handlers
  const handleAddLesson = () => {
    if (!selectedCourseId) {
      toast.warning("Please select a course first");
      return;
    }
    setEditingItem(null);
    setShowLessonForm(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingItem(lesson);
    setShowLessonForm(true);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setDeleteTarget({ type: "lesson", id: lesson._id!, name: lesson.title });
    setShowDeleteConfirm(true);
  };

  const handleSaveLesson = async (lessonData: Partial<Lesson>) => {
    try {
      const dataWithCourse = { ...lessonData, courseId: selectedCourseId };

      if (editingItem) {
        await updateLesson(editingItem._id, dataWithCourse);
        toast.success("Lesson updated successfully");
      } else {
        await createLesson(dataWithCourse);
        toast.success("Lesson created successfully");
      }
      setShowLessonForm(false);
      setEditingItem(null);
      loadLessons(selectedCourseId);
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson");
    }
  };

  // Assignment CRUD handlers
  const handleAddAssignment = () => {
    setEditingItem(null);
    setShowAssignmentForm(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingItem(assignment);
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setDeleteTarget({
      type: "assignment",
      id: assignment._id!,
      name: assignment.title,
    });
    setShowDeleteConfirm(true);
  };

  const handleSaveAssignment = async (assignmentData: Partial<Assignment>) => {
    try {
      if (editingItem) {
        await updateAssignment(editingItem._id, assignmentData);
        toast.success("Assignment updated successfully");
      } else {
        await createAssignment(assignmentData);
        toast.success("Assignment created successfully");
      }
      setShowAssignmentForm(false);
      setEditingItem(null);
      // Refresh grid data
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast.error("Failed to save assignment");
    }
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      switch (deleteTarget.type) {
        case "course":
          await deleteCourse(deleteTarget.id);
          toast.success("Course deleted successfully");
          window.location.reload(); // Refresh courses
          break;
        case "lesson":
          await deleteLesson(deleteTarget.id);
          toast.success("Lesson deleted successfully");
          loadLessons(selectedCourseId);
          break;
        case "assignment":
          await deleteAssignment(deleteTarget.id);
          toast.success("Assignment deleted successfully");
          window.location.reload(); // Refresh assignments
          break;
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(`Failed to delete ${deleteTarget.type}`);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Load lessons by course
  const loadLessons = useCallback(async (courseId: string) => {
    if (!courseId) return;

    setLessonsLoading(true);
    try {
      const result = await getLessonsByCourse({ courseId });
      setLessons(result.rowData || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast.error("Failed to load lessons");
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  // Load courses for dropdown
  const loadCoursesForDropdown = useCallback(async () => {
    try {
      const result = await getCourses();
      setCourses(result.data.rows);
    } catch (error) {
      console.error("Error loading courses for dropdown:", error);
    }
  }, []);

  // Load lessons when course selection changes
  useEffect(() => {
    if (selectedCourseId && activeTab === "lessons") {
      loadLessons(selectedCourseId);
    }
  }, [selectedCourseId, activeTab, loadLessons]);

  // Load courses when switching to lessons tab
  useEffect(() => {
    if (activeTab === "lessons") {
      loadCoursesForDropdown();
    }
  }, [activeTab, loadCoursesForDropdown]);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 col-lg-2 bg-light p-0">
          <div
            className="d-flex flex-column p-3"
            style={{ minHeight: "100vh" }}
          >
            <h5 className="mb-4">{t("instructor.dashboard")}</h5>
            <nav className="nav flex-column">
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "courses" ? "active bg-primary text-white" : ""
                }`}
                onClick={() => setActiveTab("courses")}
              >
                📚 {t("instructor.courses")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "lessons" ? "active bg-primary text-white" : ""
                }`}
                onClick={() => setActiveTab("lessons")}
              >
                📖 {t("instructor.lessons")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "assignments"
                    ? "active bg-primary text-white"
                    : ""
                }`}
                onClick={() => setActiveTab("assignments")}
              >
                📝 {t("instructor.assignments")}
              </button>
              <button
                className={`nav-link btn btn-link text-start ${
                  activeTab === "statistics"
                    ? "active bg-primary text-white"
                    : ""
                }`}
                onClick={() => setActiveTab("statistics")}
              >
                📊 {t("instructor.statistics")}
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
                  <h2>{t("instructor.courses")}</h2>
                  <button className="btn btn-primary" onClick={handleAddCourse}>
                    {t("instructor.addCourse")}
                  </button>
                </div>

                <div
                  className="ag-theme-alpine"
                  style={{ height: "600px", width: "100%" }}
                >
                  <AgGridReact
                    columnDefs={courseColumnDefs}
                    rowModelType="infinite"
                    datasource={coursesDataSource}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection="single"
                    animateRows={true}
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                      filter: true,
                    }}
                    overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t(
                      "instructor.table.loading"
                    )}</span>`}
                    overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t(
                      "instructor.table.noData"
                    )}</span>`}
                  />
                </div>
              </div>
            )}

            {activeTab === "lessons" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>{t("instructor.lessons")}</h2>
                  <div className="d-flex gap-3">
                    <select
                      className="form-select"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      style={{ width: "250px" }}
                    >
                      <option value="">Select a course...</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddLesson}
                      disabled={!selectedCourseId}
                    >
                      Add Lesson
                    </button>
                  </div>
                </div>

                {selectedCourseId ? (
                  <div
                    className="ag-theme-alpine"
                    style={{ height: "600px", width: "100%" }}
                  >
                    <AgGridReact
                      columnDefs={lessonColumnDefs}
                      rowData={lessons}
                      pagination={true}
                      paginationPageSize={20}
                      rowSelection="single"
                      animateRows={true}
                      loading={lessonsLoading}
                      defaultColDef={{
                        resizable: true,
                        sortable: true,
                        filter: true,
                      }}
                      overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t(
                        "instructor.table.loading"
                      )}</span>`}
                      overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t(
                        "instructor.table.noData"
                      )}</span>`}
                    />
                  </div>
                ) : (
                  <div className="card">
                    <div className="card-body text-center py-5">
                      <h5>Select a course to manage lessons</h5>
                      <p className="text-muted">
                        Choose a course from the dropdown above to view and
                        manage its lessons.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "assignments" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>{t("instructor.assignments")}</h2>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddAssignment}
                  >
                    {t("instructor.addAssignment")}
                  </button>
                </div>

                <div
                  className="ag-theme-alpine"
                  style={{ height: "600px", width: "100%" }}
                >
                  <AgGridReact
                    columnDefs={assignmentColumnDefs}
                    rowModelType="infinite"
                    datasource={assignmentsDataSource}
                    pagination={true}
                    paginationPageSize={20}
                    rowSelection="single"
                    animateRows={true}
                    loading={assignmentsLoading}
                    defaultColDef={{
                      resizable: true,
                      sortable: true,
                      filter: true,
                      minWidth: 100,
                    }}
                    overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t(
                      "instructor.table.loading"
                    )}</span>`}
                    overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t(
                      "instructor.table.noData"
                    )}</span>`}
                    suppressScrollOnNewData={true}
                    rowBuffer={10}
                    maxBlocksInCache={2}
                    cacheBlockSize={20}
                    maxConcurrentDatasourceRequests={1}
                    onGridReady={(params) => {
                      console.log("Assignment grid ready", params);
                      // Force refresh
                      setTimeout(() => {
                        params.api.refreshInfiniteCache();
                      }, 100);
                    }}
                    onFirstDataRendered={(params) => {
                      console.log("Assignment first data rendered", params);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "statistics" && (
              <div>
                <h2 className="mb-4">{t("instructor.statistics")}</h2>
                <div className="row g-4">
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-primary">12</h3>
                        <p className="card-text">Total Courses</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-success">150</h3>
                        <p className="card-text">Total Students</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-info">45</h3>
                        <p className="card-text">Assignments</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card text-center">
                      <div className="card-body">
                        <h3 className="text-warning">85%</h3>
                        <p className="card-text">Completion Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forms and Modals */}
      {showCourseForm && (
        <CourseForm
          course={editingItem}
          onSave={handleSaveCourse}
          onCancel={() => {
            setShowCourseForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showLessonForm && (
        <LessonForm
          lesson={editingItem}
          onSave={handleSaveLesson}
          onCancel={() => {
            setShowLessonForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showAssignmentForm && (
        <AssignmentForm
          assignment={editingItem}
          onSave={handleSaveAssignment}
          onCancel={() => {
            setShowAssignmentForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {showDeleteConfirm && deleteTarget && (
        <ConfirmDialog
          title={t("instructor.confirmDelete.title")}
          message={t("instructor.confirmDelete.message", {
            type: deleteTarget.type,
          })}
          confirmText={t("instructor.confirmDelete.confirm")}
          cancelText={t("instructor.confirmDelete.cancel")}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default InstructorDashboardEnhanced;
