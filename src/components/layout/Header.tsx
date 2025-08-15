import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../../api/axiosInstance";

interface HeaderProps {
  user?: {
    username: string;
    role: string;
  } | null;
  setUser?: (user: any) => void;
}

const Header: React.FC<HeaderProps> = ({ user, setUser }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.error("Logout API error", err);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    if (setUser) setUser(null);
    navigate("/");
  };

  return (
    <header
      style={{
        backgroundColor: "var(--white)",
        borderBottom: "1px solid var(--neutral-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <nav className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center py-3">
          {/* Logo */}
          <Link
            to="/"
            className="text-decoration-none"
            style={{
              color: "var(--primary-color)",
              fontSize: "1.75rem",
              fontWeight: "800",
              letterSpacing: "-0.025em",
            }}
          >
            EduFlow
          </Link>

          {/* Main Navigation */}
          <div className="d-flex align-items-center gap-4">
            <Link to="/" className="nav-link-modern">
              {t("Home")}
            </Link>
            {user && (
              <Link to="/dashboard" className="nav-link-modern">
                {t("Dashboard")}
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="d-flex align-items-center gap-3">
            {user ? (
              <div className="dropdown">
                <button
                  className="btn d-flex align-items-center px-3 py-2 border-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  style={{
                    backgroundColor: "var(--neutral-bg)",
                    border: "1px solid var(--neutral-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    className="rounded-circle me-2"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "var(--primary-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                    }}
                  >
                    {user.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  {user.username}
                </button>
                <ul
                  className="dropdown-menu border-0"
                  style={{
                    boxShadow: "var(--shadow-lg)",
                    borderRadius: "var(--radius-md)",
                    padding: "var(--spacing-xs) 0",
                  }}
                >
                  <li>
                    <Link
                      className="dropdown-item px-3 py-2"
                      to="/profile"
                      style={{
                        color: "var(--text-primary)",
                        fontWeight: "500",
                      }}
                    >
                      {t("Profile")}
                    </Link>
                  </li>
                  <li>
                    <hr
                      className="dropdown-divider"
                      style={{ margin: "var(--spacing-xs) 0" }}
                    />
                  </li>
                  <li>
                    <button
                      className="dropdown-item px-3 py-2 border-0 bg-transparent w-100 text-start"
                      onClick={handleLogout}
                      style={{
                        color: "var(--error)",
                        fontWeight: "500",
                      }}
                    >
                      {t("Logout")}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-modern-outline">
                  {t("Login")}
                </Link>
                <Link to="/register" className="btn btn-modern-primary">
                  {t("Register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
