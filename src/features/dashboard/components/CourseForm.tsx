import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Course } from "../../../types/course";

interface CourseFormProps {
  course?: Course | null;
  onSave: (courseData: Partial<Course>) => void;
  onCancel: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({
  course,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: 0,
    price: 0,
    maxStudents: 50,
    isPublished: false,
    thumbnailUrl: "",
    introVideoUrl: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        category: course.category || "",
        difficulty: course.difficulty || "beginner",
        duration: course.duration || 0,
        price: course.price || 0,
        maxStudents: course.maxStudents || 50,
        isPublished: course.isPublished || false,
        thumbnailUrl: course.thumbnailUrl || "",
        introVideoUrl: course.introVideoUrl || "",
        tags: course.tags || [],
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
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
              {course ? t("instructor.editCourse") : t("instructor.addCourse")}
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
                    <label className="form-label">
                      {t("instructor.courseForm.title")}
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
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.courseForm.category")}
                    </label>
                    <select
                      className="form-select"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Programming">Programming</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Data Science">Data Science</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  {t("instructor.courseForm.description")}
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

              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.courseForm.difficulty")}
                    </label>
                    <select
                      className="form-select"
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.courseForm.duration")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="0"
                      step="0.5"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.courseForm.price")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.courseForm.maxStudents")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="maxStudents"
                      value={formData.maxStudents}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="form-check mt-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isPublished"
                        id="isPublished"
                        checked={formData.isPublished}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="isPublished">
                        {t("instructor.courseForm.isPublished")}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="url"
                  className="form-control"
                  name="thumbnailUrl"
                  value={formData.thumbnailUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Intro Video URL</label>
                <input
                  type="url"
                  className="form-control"
                  name="introVideoUrl"
                  value={formData.introVideoUrl}
                  onChange={handleInputChange}
                />
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
                {t("instructor.courseForm.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseForm;
