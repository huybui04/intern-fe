import { useState } from "react";
import { UserResponse } from "../../types/user";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/auth";

interface LoginProps {
  setUser: (user: UserResponse) => void;
}

export default function Login({ setUser }: LoginProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login(form);
      localStorage.setItem("token", res.data.token);
      if (res.data.user && res.data.user.role) {
        localStorage.setItem("role", res.data.user.role);
      }
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user); // cập nhật state user ngay
      }
      if (
        res.data.user &&
        res.data.user._id &&
        res.data.user.role === "student"
      ) {
        localStorage.setItem("studentId", res.data.user._id);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.loginFailed"));
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
                    {t("auth.login")}
                  </h1>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Welcome back! Please sign in to your account.
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
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

                  <div className="mb-4">
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
                    {t("auth.login")}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p style={{ color: "var(--text-secondary)" }}>
                    Don't have an account?{" "}
                    <a
                      href="/register"
                      style={{
                        color: "var(--primary-color)",
                        textDecoration: "none",
                        fontWeight: "500",
                      }}
                    >
                      Sign up here
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
