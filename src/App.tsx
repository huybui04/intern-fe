import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import HomePage from "./features/home/HomePage";
import CourseDetail from "./features/courses/CourseDetail";
import { UserResponse } from "./types/user";
import Dashboard from "./features/dashboard/DashboardIndex";

function App() {
  const [user, setUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    // Check if user is logged in on app startup
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    }
  }, []);

  return (
    <Router>
      <Layout user={user} setUser={setUser}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/courses" element={<CourseList />} /> */}
          <Route path="/courses/:id" element={<CourseDetail />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAuth={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Assignment Routes */}
          {/* <Route
            path="/assignments/:id"
            element={
              <ProtectedRoute requireAuth={true}>
                <AssignmentDetail />
              </ProtectedRoute>
            }
          /> */}

          {/* Lesson Routes */}
          {/* <Route
            path="/lessons/:id"
            element={
              <ProtectedRoute requireAuth={true}>
                <LessonDetailView />
              </ProtectedRoute>
            }
          /> */}

          {/* Student Routes */}
          {/* <Route
            path="/my-courses"
            element={
              <ProtectedRoute allowedRoles={["student"]} requireAuth={true}>
                <CourseList />
              </ProtectedRoute>
            }
          /> */}

          {/* Instructor Routes */}
          {/* <Route
            path="/courses/create"
            element={
              <ProtectedRoute
                allowedRoles={["instructor", "admin"]}
                requireAuth={true}
              >
                <CourseDetailView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:id/edit"
            element={
              <ProtectedRoute
                allowedRoles={["instructor", "admin"]}
                requireAuth={true}
              >
                <CourseDetailView />
              </ProtectedRoute>
            }
          /> */}

          {/* Admin Routes */}
          {/* <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin"]} requireAuth={true}>
                <div>Admin Panel Coming Soon</div>
              </ProtectedRoute>
            }
          /> */}

          {/* Error Routes */}
          <Route
            path="/unauthorized"
            element={
              <div className="container py-5 text-center">
                <h2>Unauthorized Access</h2>
                <p>You don't have permission to access this page.</p>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div className="container py-5 text-center">
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
              </div>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
