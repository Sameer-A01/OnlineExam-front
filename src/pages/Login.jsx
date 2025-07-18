
import React, { useState } from "react";
import axiosInstance from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    name: "",
    section: "",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        await login(response.data.user, response.data.token);
        toast.success("Logged in successfully!", {
          duration: 3000,
          position: "top-right",
          icon: "🎉",
        });
        if (response.data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      } else {
        setErrorMessage(response.data.error);
        toast.error(response.data.error, {
          duration: 3000,
          position: "top-right",
        });
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "An error occurred. Please try again.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!forgotPasswordForm.name || !forgotPasswordForm.section) {
      toast.error("Please fill in both name and section.", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    const message = `Hello, I am ${forgotPasswordForm.name} from section ${forgotPasswordForm.section}. I need assistance with resetting my password for Lakshya Classes.`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/+918638271136?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");

    toast.success("Opening WhatsApp to contact admin!", {
      duration: 3000,
      position: "top-right",
      icon: "📱",
    });

    setForgotPasswordForm({ name: "", section: "" });
    setShowForgotPasswordModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-green-700 via-green-600 to-gray-100 py-8 sm:py-12">
      {/* Toaster Component for Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#ffffff",
            color: "#333",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            padding: "10px 14px",
            fontSize: "13px",
            fontWeight: "400",
            border: "1px solid rgba(0, 0, 0, 0.05)",
            maxWidth: "350px",
          },
          success: {
            style: {
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
            },
            iconTheme: {
              primary: "#065f46Frances",
              secondary: "#ecfdf5",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              border: "1px solid #ef4444",
              color: "#991b1b",
            },
            iconTheme: {
              primary: "#991b1b",
              secondary: "#fef2f2",
            },
          },
        }}
      />

      {/* Login Form */}
      <div className="flex items-center justify-center flex-1 w-full">
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">
          {/* Logo and Branding */}
         <div className="flex flex-col items-center mb-8">
  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center mb-3 overflow-hidden shadow-md">
  <img
    src="/Logo.jpg"
    alt="Lakshya Classes Logo"
    className="w-full h-full object-contain p-2"
  />
  </div>
  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center">
    Lakshya Classes
  </h1>
  <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">
    Empowering Education, Inspiring Success
  </p>
</div>

          {/* Form Header */}
          <h2 className="text-lg sm:text-xl font-medium text-gray-900 mb-6 text-center">
            Sign In
          </h2>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white placeholder-gray-400 text-sm"
                required
                aria-required="true"
                aria-describedby="email-error"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white placeholder-gray-400 text-sm"
                required
                aria-required="true"
                aria-describedby="password-error"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={loading ? "Logging in" : "Sign In"}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowForgotPasswordModal(true);
                toast.success("Opened forgot password form.", {
                  duration: 3000,
                  position: "top-right",
                  icon: "🔑",
                });
              }}
              className="text-sm text-green-600 hover:text-green-700 transition-colors duration-200 font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Forgot Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  // toast.success("Closed forgot password form.", {
                  //   duration: 3000,
                  //   position: "top-right",
                  //   icon: "🔙",
                  // });
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4 text-center">
              Contact your admin to reset your password.
            </p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={forgotPasswordForm.name}
                  onChange={(e) =>
                    setForgotPasswordForm({ ...forgotPasswordForm, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white placeholder-gray-400 text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="section"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Section Name
                </label>
                <input
                  type="text"
                  id="section"
                  value={forgotPasswordForm.section}
                  onChange={(e) =>
                    setForgotPasswordForm({ ...forgotPasswordForm, section: e.target.value })
                  }
                  placeholder="Enter your section name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white placeholder-gray-400 text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium"
              >
                Contact Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
    
    </div>
  );
};

export default Login;
