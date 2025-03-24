import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <nav className="bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-white font-bold text-xl">
                SocialShare
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  to="/"
                  className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/explore"
                  className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md font-medium"
                >
                  Explore
                </Link>
                {currentUser && (
                  <Link
                    to="/create"
                    className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md font-medium"
                  >
                    Create Post
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {currentUser ? (
                <div className="flex items-center">
                  <Link
                    to={`/profile/${currentUser.uid}`}
                    className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md font-medium mr-3"
                  >
                    {currentUser.displayName}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-white bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-indigo-500 inline-flex items-center justify-center p-2 rounded-md focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="text-white hover:bg-indigo-500 block px-3 py-2 rounded-md font-medium"
            >
              Home
            </Link>
            <Link
              to="/explore"
              className="text-white hover:bg-indigo-500 block px-3 py-2 rounded-md font-medium"
            >
              Explore
            </Link>
            {currentUser && (
              <Link
                to="/create"
                className="text-white hover:bg-indigo-500 block px-3 py-2 rounded-md font-medium"
              >
                Create Post
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-700">
            {currentUser ? (
              <div className="px-2 space-y-1">
                <Link
                  to={`/profile/${currentUser.uid}`}
                  className="text-white hover:bg-indigo-500 block px-3 py-2 rounded-md font-medium"
                >
                  {currentUser.displayName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white bg-indigo-700 hover:bg-indigo-800 w-full text-left px-3 py-2 rounded-md font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  className="text-white hover:bg-indigo-500 block px-3 py-2 rounded-md font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-white bg-indigo-700 hover:bg-indigo-800 block px-3 py-2 rounded-md font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
