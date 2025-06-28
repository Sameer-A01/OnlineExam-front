import React, { useState } from "react";
import axiosInstance from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
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
        if (response.data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      } else {
        setErrorMessage(response.data.error);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-700 via-green-600 to-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 transform transition-all duration-300 hover:shadow-2xl">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-500 to-green-700 rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-2xl sm:text-3xl font-bold">LC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Lakshya Classes
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 text-center">
            Empowering Education, Inspiring Success
          </p>
        </div>

        {/* Form Header */}
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 text-center">
          Sign In
        </h2>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm sm:text-base flex items-center">
            <svg
              className="w-5 h-5 mr-2"
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
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/50 placeholder-gray-500 text-sm sm:text-base"
              required
              aria-required="true"
              aria-describedby="email-error"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm sm:text-base font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white/50 placeholder-gray-500 text-sm sm:text-base"
              required
              aria-required="true"
              aria-describedby="password-error"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={loading ? "Logging in" : "Sign In"}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <a
            href="/forgot-password"
            className="text-sm sm:text-base text-green-600 hover:text-green-800 transition-colors duration-200"
          >
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;