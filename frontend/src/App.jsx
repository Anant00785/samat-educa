import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AIChatbot from './components/AIChatbot';

// Pages
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageDepartments from './pages/admin/ManageDepartments';
import AdminFees from './pages/admin/AdminFees';
import CCTVMonitor from './pages/admin/CCTVMonitor';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import AttendancePage from './pages/student/AttendancePage';
import MarksPage from './pages/student/MarksPage';
import FeesPage from './pages/student/FeesPage';
import OnlineExam from './pages/student/OnlineExam';
import StressDetection from './pages/student/StressDetection';
import StudyPlanner from './pages/student/StudyPlanner';
import CareerGuidance from './pages/student/CareerGuidance';
import WearableWellness from './pages/student/WearableWellness';
import Leaderboard from './pages/student/Leaderboard';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MarkAttendance from './pages/faculty/MarkAttendance';
import CreateExam from './pages/faculty/CreateExam';
import PredictiveAnalytics from './pages/faculty/PredictiveAnalytics';
import ExamViolationsReview from './pages/faculty/ExamViolationsReview';

// Parent Pages
import ParentDashboard from './pages/parent/ParentDashboard';

// Layout wrapper for authenticated pages (sidebar + navbar)
function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Navbar />
        <main className="dashboard-body">
          <Outlet />
        </main>
      </div>
      <AIChatbot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Home redirects based on role */}
          <Route path="/" element={
            <PrivateRoute><HomePage /></PrivateRoute>
          } />

          {/* ── ADMIN ── */}
          <Route element={<PrivateRoute roles={['ADMIN']}><DashboardLayout /></PrivateRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/predictive" element={<PredictiveAnalytics />} />
            <Route path="/admin/cctv" element={<CCTVMonitor />} />
            <Route path="/admin/students" element={<ManageStudents />} />
            <Route path="/admin/faculty" element={<ManageFaculty />} />
            <Route path="/admin/departments" element={<ManageDepartments />} />
            <Route path="/admin/fees" element={<AdminFees />} />
          </Route>

          {/* ── STUDENT ── */}
          <Route element={<PrivateRoute roles={['STUDENT']}><DashboardLayout /></PrivateRoute>}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/study-plan" element={<StudyPlanner />} />
            <Route path="/student/career" element={<CareerGuidance />} />
            <Route path="/student/wellness" element={<StressDetection />} />
            <Route path="/student/wearable" element={<WearableWellness />} />
            <Route path="/student/leaderboard" element={<Leaderboard />} />
            <Route path="/student/attendance" element={<AttendancePage />} />
            <Route path="/student/marks" element={<MarksPage />} />
            <Route path="/student/fees" element={<FeesPage />} />
            <Route path="/student/exam" element={<OnlineExam />} />
          </Route>

          {/* ── FACULTY ── */}
          <Route element={<PrivateRoute roles={['FACULTY']}><DashboardLayout /></PrivateRoute>}>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/attendance" element={<MarkAttendance />} />
            <Route path="/faculty/predictive" element={<PredictiveAnalytics />} />
            <Route path="/faculty/exam-violations" element={<ExamViolationsReview />} />
            <Route path="/faculty/create-exam" element={<CreateExam />} />
          </Route>

          {/* ── PARENT ── */}
          <Route element={<PrivateRoute roles={['PARENT']}><DashboardLayout /></PrivateRoute>}>
            <Route path="/parent" element={<ParentDashboard />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
