import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

const Signup = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const { signup, error: authError } = useAuth();
	const navigate = useNavigate();

	// Listen for errors from the auth provider
	useEffect(() => {
		if (authError) {
			setError(authError);
		}
	}, [authError]);

	const validateForm = () => {
		// Reset errors
		setError("");

		// Validate display name
		if (!displayName.trim()) {
			setError("Display name is required");
			return false;
		}

		// Validate email format with regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			setError("Please enter a valid email address");
			return false;
		}

		// Validate password
		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return false;
		}

		// Confirm passwords match
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			setLoading(true);
			setError("");
			setSuccessMessage("Creating your account...");

			console.log("Submitting signup form with:", { email, displayName });

			const user = await signup(email, password, displayName);
			console.log("Signup successful, user:", user?.uid);

			setSuccessMessage("Account created successfully! Redirecting...");

			// Short delay before redirect for better UX
			setTimeout(() => {
				navigate("/");
			}, 1500);
		} catch (err) {
			console.error("Error during signup:", err);
			setSuccessMessage("");

			// Only set the error if not already set by the auth provider
			if (!error) {
				setError(
					err.message || "Failed to create an account. Please try again."
				);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Create a new account
					</h2>
				</div>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				)}

				{successMessage && (
					<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
						{successMessage}
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="display-name" className="sr-only">
								Display Name
							</label>
							<input
								id="display-name"
								name="displayName"
								type="text"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Display Name"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor="email-address" className="sr-only">
								Email address
							</label>
							<input
								id="email-address"
								name="email"
								type="email"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Password (min 6 characters)"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor="confirm-password" className="sr-only">
								Confirm Password
							</label>
							<input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
						>
							{loading ? "Creating Account..." : "Sign up"}
						</button>
					</div>

					<div className="text-center">
						<p className="text-sm text-gray-600">
							Already have an account?{" "}
							<Link
								to="/login"
								className="font-medium text-indigo-600 hover:text-indigo-500"
							>
								Sign in
							</Link>
						</p>
					</div>
				</form>
			</div>
		</div>
	);
};

export default Signup;
