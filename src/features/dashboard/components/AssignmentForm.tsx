import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Assignment } from "../../../types/assignment";

interface AssignmentFormProps {
  assignment?: Assignment | null;
  onSave: (assignmentData: Partial<Assignment>) => void;
  onCancel: () => void;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({
  assignment,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    totalPoints: 100,
    isPublished: false,
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || "",
        description: assignment.description || "",
        dueDate: assignment.dueDate
          ? new Date(assignment.dueDate).toISOString().slice(0, 16)
          : "",
        totalPoints: assignment.totalPoints || 100,
        isPublished: assignment.isPublished || false,
      });
    }
  }, [assignment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      dueDate: formData.dueDate
        ? new Date(formData.dueDate).toISOString()
        : undefined,
    };
    onSave(dataToSave);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

              <div className="row">
                <div className="col-md-6">
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
                <div className="col-md-6">
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
    </div>
  );
};

export default AssignmentForm;
