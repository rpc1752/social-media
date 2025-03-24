import { useState, useEffect } from "react";
import {
	collection,
	query,
	orderBy,
	limit,
	onSnapshot,
	doc,
	updateDoc,
	arrayUnion,
	arrayRemove,
	deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const PostList = ({ userId = null }) => {
	const [posts, setPosts] = useState([]);
	const [loading, setLoading] = useState(true);
	const { currentUser } = useAuth();

	useEffect(() => {
		let postsQuery;

		if (userId) {
			// Get posts from a specific user
			postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
		} else {
			// Get all posts
			postsQuery = query(
				collection(db, "posts"),
				orderBy("createdAt", "desc"),
				limit(20)
			);
		}

		const unsubscribe = onSnapshot(
			postsQuery,
			(snapshot) => {
				const postData = snapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
					createdAt: doc.data().createdAt?.toDate(),
				}));

				// If we're on a user profile, filter for that user's posts
				if (userId) {
					setPosts(postData.filter((post) => post.userId === userId));
				} else {
					setPosts(postData);
				}

				setLoading(false);
			},
			(error) => {
				console.error("Error fetching posts:", error);
				setLoading(false);
			}
		);

		return unsubscribe;
	}, [userId]);

	const handleLike = async (postId) => {
		if (!currentUser) return;

		const postRef = doc(db, "posts", postId);
		const post = posts.find((p) => p.id === postId);

		if (post.likes && post.likes.includes(currentUser.uid)) {
			// Unlike the post
			await updateDoc(postRef, {
				likes: arrayRemove(currentUser.uid),
			});
		} else {
			// Like the post
			await updateDoc(postRef, {
				likes: arrayUnion(currentUser.uid),
			});
		}
	};

	const handleDelete = async (postId) => {
		if (!currentUser) return;

		const post = posts.find((p) => p.id === postId);

		if (post.userId !== currentUser.uid) {
			console.error("You can't delete someone else's post");
			return;
		}

		if (confirm("Are you sure you want to delete this post?")) {
			try {
				await deleteDoc(doc(db, "posts", postId));
			} catch (error) {
				console.error("Error deleting post:", error);
			}
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
			</div>
		);
	}

	if (posts.length === 0) {
		return (
			<div className="text-center text-gray-500 my-12">
				{userId
					? "This user hasn't posted anything yet."
					: "No posts yet. Be the first to post!"}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{posts.map((post) => (
				<div
					key={post.id}
					className="bg-white rounded-lg shadow-md overflow-hidden"
				>
					<div className="p-4">
						<div className="flex items-center mb-4">
							<Link
								to={`/profile/${post.userId}`}
								className="font-medium text-gray-900 hover:underline"
							>
								{post.authorName}
							</Link>
							<span className="text-gray-500 text-sm ml-2">
								{post.createdAt
									? format(post.createdAt, "MMM d, yyyy HH:mm")
									: "Just now"}
							</span>
						</div>
						<h3 className="text-xl font-semibold mb-2">{post.title}</h3>
						<p className="text-gray-700 mb-4">{post.content}</p>

						{post.imageUrl && (
							<div className="mb-4">
								<img
									src={post.imageUrl}
									alt={post.title}
									className="w-full h-auto rounded-lg"
								/>
							</div>
						)}

						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<button
									onClick={() => handleLike(post.id)}
									className={`flex items-center space-x-1 ${
										currentUser && post.likes?.includes(currentUser.uid)
											? "text-blue-500"
											: "text-gray-500 hover:text-blue-500"
									}`}
								>
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
									</svg>
									<span>{post.likes?.length || 0}</span>
								</button>

								<Link
									to={`/post/${post.id}`}
									className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
								>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
										></path>
									</svg>
									<span>{post.comments?.length || 0}</span>
								</Link>
							</div>

							{currentUser && post.userId === currentUser.uid && (
								<div className="flex space-x-2">
									<Link
										to={`/edit-post/${post.id}`}
										className="text-gray-500 hover:text-indigo-600"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											></path>
										</svg>
									</Link>
									<button
										onClick={() => handleDelete(post.id)}
										className="text-gray-500 hover:text-red-600"
									>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											></path>
										</svg>
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	);
};

export default PostList;
