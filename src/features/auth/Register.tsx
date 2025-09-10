import { useState } from "react";
import { register } from "../../api/auth";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<{
    username: string;
    email: string;
    password: string;
    role: "student" | "instructor" | "admin";
  }>({
    username: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      // setSuccess("Registration successful! Redirecting to login...");
      setError("");
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.registerFailed"));
      setSuccess("");
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{ backgroundColor: "var(--neutral-bg)" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div
              className="card"
              style={{
                border: "none",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-lg)",
                padding: "var(--spacing-md)",
              }}
            >
              <div
                className="card-body"
                style={{ padding: "var(--spacing-xl)" }}
              >
                <div className="text-center mb-4">
                  <h1
                    style={{
                      fontSize: "2rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      marginBottom: "var(--spacing-sm)",
                    }}
                  >
                    {t("auth.register")}
                  </h1>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Create your account to get started.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label
                      htmlFor="username"
                      className="form-label"
                      style={{
                        fontWeight: "500",
                        color: "var(--text-primary)",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      {t("auth.username")}
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                      className="form-control"
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--neutral-border)",
                        padding: "0.75rem 1rem",
                        fontSize: "1rem",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="email"
                      className="form-label"
                      style={{
                        fontWeight: "500",
                        color: "var(--text-primary)",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      {t("auth.email")}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="form-control"
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--neutral-border)",
                        padding: "0.75rem 1rem",
                        fontSize: "1rem",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor="password"
                      className="form-label"
                      style={{
                        fontWeight: "500",
                        color: "var(--text-primary)",
                        marginBottom: "var(--spacing-xs)",
                      }}
                    >
                      {t("auth.password")}
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      className="form-control"
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--neutral-border)",
                        padding: "0.75rem 1rem",
                        fontSize: "1rem",
                        transition: "all 0.2s ease",
                      }}
                    />
                  </div>

                  {error && (
                    <div
                      className="alert alert-danger"
                      style={{
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #FECACA",
                        color: "var(--error)",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--spacing-sm) var(--spacing-md)",
                        marginBottom: "var(--spacing-md)",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {success && (
                    <div
                      className="alert alert-success"
                      style={{
                        backgroundColor: "#D1FAE5",
                        border: "1px solid #A7F3D0",
                        color: "#065F46",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--spacing-sm) var(--spacing-md)",
                        marginBottom: "var(--spacing-md)",
                      }}
                    >
                      {success}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn w-100"
                    style={{
                      backgroundColor: "var(--primary-color)",
                      color: "white",
                      borderRadius: "var(--radius-md)",
                      fontWeight: "500",
                      padding: "0.875rem",
                      fontSize: "1rem",
                      border: "none",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--primary-hover)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--primary-color)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {t("auth.register")}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p style={{ color: "var(--text-secondary)" }}>
                    Already have an account?{" "}
                    <a
                      href="/login"
                      style={{
                        color: "var(--primary-color)",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Sign in here
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}