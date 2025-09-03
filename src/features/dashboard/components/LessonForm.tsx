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
    slug: "",
    description: "",
    content: "",
    videoUrl: "",
    attachments: [] as { name: string; fileUrl: string; fileType: string }[],
    duration: 0,
    order: 0,
    isPublished: false,
    prerequisites: [] as string[],
    quizId: "",
    viewsCount: 0,
    tags: [] as string[],
    hasAssignment: false,
  });

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        slug: lesson.slug || "",
        description: lesson.description || "",
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        attachments: lesson.attachments || [],
        duration: lesson.duration || 0,
        order: lesson.order || 0,
        isPublished: lesson.isPublished || false,
        prerequisites: lesson.prerequisites || [],
        quizId: lesson.quizId || "",
        viewsCount: lesson.viewsCount || 0,
        tags: lesson.tags || [],
        hasAssignment: lesson.hasAssignment || false,
      });
    }
  }, [lesson]);

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

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const addAttachment = () => {
    setFormData((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        { name: "", fileUrl: "", fileType: "" },
      ],
    }));
  };

  const updateAttachment = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.map((att, i) =>
        i === index ? { ...att, [field]: value } : att
      ),
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
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
              <div className="row">
                <div className="col-md-6">
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
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Slug (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="lesson-url-slug"
                    />
                  </div>
                </div>
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
                <label className="form-label">Content</label>
                <textarea
                  className="form-control"
                  name="content"
                  rows={5}
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Lesson content (Markdown supported)"
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
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      {t("instructor.lessonForm.duration")} (minutes)
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
                <div className="col-md-4">
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
                {/* <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Quiz ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="quizId"
                      value={formData.quizId}
                      onChange={handleInputChange}
                      placeholder="Enter quiz ID"
                    />
                  </div>
                </div> */}
              </div>

              <div className="mb-3">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.tags.join(", ")}
                  onChange={handleTagsChange}
                  placeholder="programming, javascript, tutorial"
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Attachments</label>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={addAttachment}
                  >
                    Add Attachment
                  </button>
                </div>
                {formData.attachments.map((attachment, index) => (
                  <div key={index} className="card mb-2">
                    <div className="card-body p-3">
                      <div className="row">
                        <div className="col-md-4">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="File name"
                            value={attachment.name}
                            onChange={(e) =>
                              updateAttachment(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                            type="url"
                            className="form-control form-control-sm"
                            placeholder="File URL"
                            value={attachment.fileUrl}
                            onChange={(e) =>
                              updateAttachment(index, "fileUrl", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-md-3">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="File type (pdf, doc, etc.)"
                            value={attachment.fileType}
                            onChange={(e) =>
                              updateAttachment(
                                index,
                                "fileType",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="col-md-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeAttachment(index)}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isPublished"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="isPublished">
                      Published
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="hasAssignment"
                      id="hasAssignment"
                      checked={formData.hasAssignment}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="hasAssignment">
                      Has Assignment
                    </label>
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
