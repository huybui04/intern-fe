import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Lesson } from "../../../types/lesson";

interface LessonFormProps {
  lesson?: Lesson | null;
  onSave: (lessonData: Partial<Lesson>) => void;
  onCancel: () => void;
}

const LessonForm: React.FC<LessonFormProps> = ({
  lesson,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: 0,
    order: 0,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        videoUrl: lesson.videoUrl || "",
        duration: lesson.duration || 0,
        order: lesson.order || 0,
      });
    }
  }, [lesson]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
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
              {lesson ? "Edit Lesson" : "Add Lesson"}
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
                <label className="form-label">
                  {t("instructor.lessonForm.title")}
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
                  {t("instructor.lessonForm.description")}
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
                <label className="form-label">
                  {t("instructor.lessonForm.videoUrl")}
                </label>
                <input
                  type="url"
                  className="form-control"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.lessonForm.duration")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.lessonForm.order")}
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="order"
                      value={formData.order}
                      onChange={handleInputChange}
                      min="0"
                      step="1"
                      required
                    />
                  </div>
                </div>
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
                {t("instructor.lessonForm.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LessonForm;
