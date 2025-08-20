import React, { useEffect } from "react";
import InstructorDashboardEnhanced from "./InstructorDashboard";
import AdminDashboard from "./AdminDashboard";

const getCurrentUserRole = () => {
  return localStorage.getItem("role");
};

const Dashboard: React.FC = () => {
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
  }, []);

  const renderDashboard = () => {
    const role = getCurrentUserRole();

    switch (role) {
      case "student":
      // return <StudentDashboard />;
      case "instructor":
        return <InstructorDashboardEnhanced />;
      case "admin":
        return <AdminDashboard />;
      default:
        return (
          <div className="container py-5">
            <div className="text-center">
              <h3>Invalid Role</h3>
              <p>Please contact administrator</p>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default Dashboard;
