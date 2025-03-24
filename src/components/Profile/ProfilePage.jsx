import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import PostList from "../Posts/PostList";
import { useAuth } from "../../hooks/useAuth";

const ProfilePage = () => {
	const { id } = useParams();
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { currentUser } = useAuth();

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				setLoading(true);
				const userDoc = await getDoc(doc(db, "users", id));

				if (userDoc.exists()) {
					setProfile({
						id: userDoc.id,
						...userDoc.data(),
					});
				} else {
					setError("User not found");
				}
			} catch (err) {
				setError("Failed to load profile");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [id]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
				<div className="text-red-500 text-center text-lg">{error}</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto my-8">
			<div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
				<div className="bg-indigo-600 h-32"></div>
				<div className="p-6 -mt-16">
					<div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0">
						<div className="relative">
							{profile.photoURL ? (
								<img
									src={profile.photoURL}
									alt={profile.displayName}
									className="w-24 h-24 rounded-full border-4 border-white bg-gray-200"
								/>
							) : (
								<div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-500">
									<svg
										className="w-12 h-12"
										fill="currentColor"
										viewBox="0 0 20 20"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											fillRule="evenodd"
											d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
											clipRule="evenodd"
										></path>
									</svg>
								</div>
							)}
						</div>
						<div className="md:ml-6 text-center md:text-left">
							<h1 className="text-2xl font-bold text-gray-900">
								{profile.displayName}
							</h1>
							{profile.bio && (
								<p className="text-gray-600 mt-1">{profile.bio}</p>
							)}
						</div>

						{currentUser && currentUser.uid === id && (
							<div className="md:ml-auto">
								<a
									href="/edit-profile"
									className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									Edit Profile
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-bold mb-6">Posts</h2>
				<PostList userId={id} />
			</div>
		</div>
	);
};

export default ProfilePage;
