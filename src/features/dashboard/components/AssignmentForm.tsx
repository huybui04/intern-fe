import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Assignment, Question } from "../../../types/assignment";
import { getCourses } from "../../../api/course";
import { getLessonsByCourse } from "../../../api/lesson";

interface AssignmentFormProps {
  assignment?: Assignment | null;
  onSave: (assignmentData: Partial<Assignment>) => void;
  onCancel: () => void;
  courseId?: string;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  assignment,
  onSave,
  onCancel,
  courseId,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    courseId: courseId || "",
    lessonId: "",
    dueDate: "",
    timeLimit: 0,
    totalPoints: 100,
    isPublished: false,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [availableCourses, setAvailableCourses] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [availableLessons, setAvailableLessons] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || "",
        description: assignment.description || "",
        instructions: assignment.instructions || "",
        courseId: assignment.courseId || courseId || "",
        lessonId: assignment.lessonId || "",
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().slice(0, 16)
          : "",
        timeLimit: assignment.timeLimit || 0,
        totalPoints: assignment.totalPoints || 100,
        isPublished: assignment.isPublished || false,
      });
      setQuestions(assignment.questions || []);
    }
    fetchCourses();
  }, [assignment, courseId]);

  // Fetch lessons when courseId changes
  useEffect(() => {
    if (formData.courseId) {
      fetchLessons(formData.courseId);
    } else {
      setAvailableLessons([]);
    }
  }, [formData.courseId]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await getCourses();
      const courses = response.data.rows.map((course) => ({
        id: course._id,
        title: course.title,
      }));
      setAvailableCourses(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    try {
      setLoadingLessons(true);
      const response = await getLessonsByCourse({ courseId });
      const lessons = response.rowData.map((lesson) => ({
        id: lesson._id,
        title: lesson.title,
      }));
      setAvailableLessons(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      setAvailableLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      questions,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : undefined,
    };
    onSave(dataToSave);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          type === "checkbox"
            ? (e.target as HTMLInputElement).checked
            : type === "number"
            ? Number(value)
            : value,
      };

      // Reset lessonId when courseId changes
      if (name === "courseId") {
        newData.lessonId = "";
      }

      return newData;
    });
  };

  const addQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionForm(true);
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionForm(true);
  };

  const saveQuestion = (questionData: Question) => {
    if (editingQuestion) {
      // Edit existing question
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestion.id
            ? { ...questionData, id: editingQuestion.id }
            : q
        )
      );
    } else {
      // Add new question
      const newQuestion = {
        ...questionData,
        id: `q_${Date.now()}`,
      };
      setQuestions((prev) => [...prev, newQuestion]);
    }
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const calculateTotalPoints = () => {
    return questions.reduce((total, q) => total + q.points, 0);
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {assignment ? "Edit Assignment" : "Add Assignment"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingCourses}
                    >
                      <option value="">
                        {loadingCourses
                          ? "Loading courses..."
                          : "Select a course"}
                      </option>
                      {availableCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Lesson (Optional)</label>
                    <select
                      className="form-select"
                      name="lessonId"
                      value={formData.lessonId}
                      onChange={handleInputChange}
                      disabled={!formData.courseId || loadingLessons}
                    >
                      <option value="">
                        {!formData.courseId
                          ? "Select a course first"
                          : loadingLessons
                          ? "Loading lessons..."
                          : "Select a lesson"}
                      </option>
                      {availableLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {t("instructor.assignmentForm.title")}
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {t("instructor.assignmentForm.description")}
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Instructions</label>
                <textarea
                  className="form-control"
                  name="instructions"
                  rows={3}
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Enter detailed instructions for students..."
                />
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.assignmentForm.dueDate")}
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Time Limit (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="timeLimit"
                      value={formData.timeLimit}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      placeholder="0 = No time limit"
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.assignmentForm.totalPoints")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalPoints"
                      value={formData.totalPoints}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="isPublished"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="isPublished">
                    {t("instructor.assignmentForm.isPublished")}
                  </label>
                </div>
              </div>

              {/* Questions Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0">Questions ({questions.length})</h6>
                  <div>
                    <small className="text-muted me-3">
                      Total Points: {calculateTotalPoints()}
                    </small>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addQuestion}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Question
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                ) : (
                  <div className="border rounded p-2">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border-bottom pb-2 mb-2 last:border-bottom-0"
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <span className="badge bg-secondary me-2">
                                Q{index + 1}
                              </span>
                              <span className="badge bg-info me-2">
                                {question.type.replace("_", " ")}
                              </span>
                              <span className="badge bg-success">
                                {question.points} pts
                              </span>
                            </div>
                            <p className="mb-1 fw-medium">
                              {question.question}
                            </p>
                            {question.type === "multiple_choice" &&
                              question.options && (
                                <div className="small text-muted">
                                  Options: {question.options.join(", ")}
                                </div>
                              )}
                            {question.correctAnswer && (
                              <div className="small text-success">
                                Correct: {String(question.correctAnswer)}
                              </div>
                            )}
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-warning"
                              onClick={() => editQuestion(question)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => deleteQuestion(question.id!)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                {t("instructor.courseForm.cancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {t("instructor.assignmentForm.save")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionForm
          question={editingQuestion}
          onSave={saveQuestion}
          onCancel={() => {
            setShowQuestionForm(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

// Question Form Component
interface QuestionFormProps {
  question?: Question | null;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    question: "",
    type: "multiple_choice" as Question["type"],
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question: question.question || "",
        type: question.type || "multiple_choice",
        options: question.options || ["", "", "", ""],
        correctAnswer: String(question.correctAnswer || ""),
        points: question.points || 1,
      });
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const questionData: Question = {
      question: formData.question,
      type: formData.type,
      points: formData.points,
    };

    if (formData.type === "multiple_choice") {
      questionData.options = formData.options.filter(
        (opt) => opt.trim() !== ""
      );
      questionData.correctAnswer = formData.correctAnswer;
    } else if (formData.type === "true_false") {
      questionData.correctAnswer = formData.correctAnswer === "true";
    } else {
      // essay type doesn't need correctAnswer
    }

    onSave(questionData);
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {question ? "Edit Question" : "Add Question"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Question *</label>
                <textarea
                  className="form-control"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      question: e.target.value,
                    }))
                  }
                  rows={3}
                  required
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Question Type *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as Question["type"],
                          correctAnswer:
                            e.target.value === "true_false" ? "true" : "",
                        }))
                      }
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Points *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.points}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          points: Number(e.target.value),
                        }))
                      }
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              {formData.type === "multiple_choice" && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Answer Options</label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="mb-2">
                        <input
                          type="text"
                          className="form-control"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correct Answer</label>
                    <select
                      className="form-select"
                      value={formData.correctAnswer}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          correctAnswer: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">Select correct answer</option>
                      {formData.options
                        .filter((opt) => opt.trim() !== "")
                        .map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {formData.type === "true_false" && (
                <div className="mb-3">
                  <label className="form-label">Correct Answer</label>
                  <select
                    className="form-select"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        correctAnswer: e.target.value,
                      }))
                    }
                    required
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {formData.type === "essay" && (
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Essay questions will require manual grading by the instructor.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Question
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignmentForm;
