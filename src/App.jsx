import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Summary from "./components/Summary";
import AuthProvider from "./context/AuthContext";
import Root from "./utils/Root";
import ProtectedRoute from "./utils/ProtectedRoute";
import Products from "./components/Products";
import Categories from "./components/Categories";
import Suppliers from "./components/Suppliers";
import Users from "./components/Users";
import Logout from "./components/Logout";
import EmployeeProducts from "./components/EmployeeProducts";
import Orders from "./components/Orders";
import Profile from "./components/Profile";
import Exam from "./components/Exam";
import MyExams from "./components/MyExams";
import Results from "./components/Results";
import Courses from "./components/Courses";
import Instructors from "./components/Instructors";
import Assignments from "./components/Assignments";
import AdminDiscussion from "./components/Discussion";
import UserDiscussion from "./components/UserDiscussion";
import MyResult from "./components/MyResult";
import MyCourses from "./components/MyCourses";
import MyInstructors from "./components/MyInstructors";
import Notice from "./components/Notice";
import MyNotice from "./components/MyNotice";
import UserDashboard from "./components/UserDashboard";
import ResultList from "./components/ResultList";


const App = () => (
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Summary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard/products"
            element={<Products />}
          />
          <Route
            path="/admin-dashboard/categories"
            element={<Categories />}
          />
          <Route
            path="/admin-dashboard/supplier"
            element={<Suppliers />}
          />
          <Route
            path="/admin-dashboard/exam"
            element={<Exam />}
          />
      
          <Route
            path="/admin-dashboard/Instructors"
            element={<Instructors />}
          />
              <Route
            path="/admin-dashboard/Courses"
            element={<Courses />}
          />
          <Route
            path="/admin-dashboard/Notice"
            element={<Notice />}
          />
          <Route
            path="/admin-dashboard/Discussion"
            element={<AdminDiscussion />}
          />
          <Route
            path="/admin-dashboard/results/:examId"
            element={<Results />}
          />
          <Route
            path="/admin-dashboard/ResultList"
            element={<ResultList />}
          />
          <Route
            path="/admin-dashboard/orders"
            element={
              <ProtectedRoute requiredRole={["admin"]}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route path="/admin-dashboard/users" element={<Users />} />
          <Route path="/admin-dashboard/profile" element={<Profile />} />
        </Route>

        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute requiredRole={["user"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="UserDashboard" element={<UserDashboard />} />
          <Route path="MyCourses" element={<MyCourses />} />
          <Route path="MyInstructors" element={<MyInstructors />} />
          <Route path="Discussions" element={<UserDiscussion />} />
          <Route path="Mynotice" element={<MyNotice />} />
          <Route path="MyExams" element={<MyExams />} />
          <Route path="MyResult" element={<MyResult />} />

          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/unauthorized"
          element={<div>Unauthorized...</div>}
        />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;