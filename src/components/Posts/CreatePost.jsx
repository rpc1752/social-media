import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

const CreatePost = () => {
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [image, setImage] = useState(null);
	const [imagePreview, setImagePreview] = useState("");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { currentUser } = useAuth();
	const navigate = useNavigate();

	const handleImageChange = (e) => {
		if (e.target.files[0]) {
			const selectedImage = e.target.files[0];
			setImage(selectedImage);

			// Create a preview
			const reader = new FileReader();
			reader.onload = () => {
				setImagePreview(reader.result);
			};
			reader.readAsDataURL(selectedImage);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!title.trim() || !content.trim()) {
			return setError("Title and content are required");
		}

		if (!currentUser) {
			return setError("You must be logged in to create a post");
		}

		setLoading(true);
		setError("");

		try {
			let imageUrl = "";

			// Upload image if there is one
			if (image) {
				const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
				const uploadTask = uploadBytesResumable(storageRef, image);

				await new Promise((resolve, reject) => {
					uploadTask.on(
						"state_changed",
						(snapshot) => {
							const progress = Math.round(
								(snapshot.bytesTransferred / snapshot.totalBytes) * 100
							);
							setUploadProgress(progress);
						},
						(error) => {
							reject(error);
						},
						async () => {
							const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
							imageUrl = downloadURL;
							resolve();
						}
					);
				});
			}

			// Add post to firestore
			const postData = {
				title,
				content,
				userId: currentUser.uid,
				authorName: currentUser.displayName,
				createdAt: serverTimestamp(),
				likes: [],
				comments: [],
			};

			if (imageUrl) {
				postData.imageUrl = imageUrl;
			}

			await addDoc(collection(db, "posts"), postData);

			navigate("/");
		} catch (err) {
			setError("Failed to create post: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="max-w-2xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
			<h2 className="text-2xl font-bold mb-6">Create New Post</h2>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
				</div>
			)}

			<form onSubmit={handleSubmit}>
				<div className="mb-4">
					<label
						htmlFor="title"
						className="block text-gray-700 font-medium mb-2"
					>
						Title
					</label>
					<input
						type="text"
						id="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="Enter post title"
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="content"
						className="block text-gray-700 font-medium mb-2"
					>
						Content
					</label>
					<textarea
						id="content"
						value={content}
						onChange={(e) => setContent(e.target.value)}
						rows="5"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="What's on your mind?"
					></textarea>
				</div>

				<div className="mb-4">
					<label
						htmlFor="image"
						className="block text-gray-700 font-medium mb-2"
					>
						Image (optional)
					</label>
					<input
						type="file"
						id="image"
						accept="image/*"
						onChange={handleImageChange}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
					/>

					{imagePreview && (
						<div className="mt-3">
							<img
								src={imagePreview}
								alt="Preview"
								className="max-h-64 rounded-md"
							/>
						</div>
					)}

					{uploadProgress > 0 && uploadProgress < 100 && (
						<div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
							<div
								className="bg-indigo-600 h-2.5 rounded-full"
								style={{ width: `${uploadProgress}%` }}
							></div>
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<button
						type="button"
						onClick={() => navigate("/")}
						className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={loading}
						className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						{loading ? "Creating..." : "Create Post"}
					</button>
				</div>
			</form>
		</div>
	);
};

export default CreatePost;
