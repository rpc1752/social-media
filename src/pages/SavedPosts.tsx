import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Container } from "@mui/material";
import { Post as PostComponent } from "../components/Post";
import { Post } from "../types";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

export const SavedPosts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSavedPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const postsQuery = query(
        collection(db, "posts"),
        where("saves", "array-contains", user.uid),
        orderBy("createdAt", "desc")
      );
      const postsSnapshot = await getDocs(postsQuery);

      if (postsSnapshot.empty) {
        setLoading(false);
        return;
      }

      const postsData = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          imageUrl: data.imageUrl,
          imageBase64: data.imageBase64,
          caption: data.caption,
          createdAt: data.createdAt.toDate(),
          likes: data.likes || [],
          comments: data.comments || [],
          saves: data.saves || [],
          fileName: data.fileName,
          fileType: data.fileType,
        } as Post;
      });

      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [user]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);

      if (postIndex === -1) return;

      const post = posts[postIndex];
      const isLiked = post.likes.includes(user.uid);

      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      const updatedPosts = [...posts];
      if (isLiked) {
        updatedPosts[postIndex].likes = updatedPosts[postIndex].likes.filter(
          (id) => id !== user.uid
        );
      } else {
        updatedPosts[postIndex].likes = [
          ...updatedPosts[postIndex].likes,
          user.uid,
        ];
      }

      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleSave = async (postId: string) => {
    if (!user) return;

    try {
      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);

      if (postIndex === -1) return;

      const post = posts[postIndex];
      const isSaved = post.saves.includes(user.uid);

      await updateDoc(postRef, {
        saves: isSaved ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });

      // If unsaving, remove it from the saved posts list
      if (isSaved) {
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        const updatedPosts = [...posts];
        updatedPosts[postIndex].saves = [
          ...updatedPosts[postIndex].saves,
          user.uid,
        ];
        setPosts(updatedPosts);
      }
    } catch (error) {
      console.error("Error saving post:", error);
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    if (!user) return;

    try {
      // If this is a special flag indicating a reply was added, just refresh the posts
      if (commentText === "REPLY_UPDATE") {
        const updatedPosts = [...posts];
        setPosts(updatedPosts);
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postIndex = posts.findIndex((post) => post.id === postId);

      if (postIndex === -1) return;

      const commentId = uuidv4();
      const comment = {
        id: commentId,
        userId: user.uid,
        text: commentText,
        createdAt: Timestamp.now(),
        replies: [],
      };

      await updateDoc(postRef, {
        comments: arrayUnion(comment),
      });

      const updatedPosts = [...posts];
      updatedPosts[postIndex].comments = [
        ...updatedPosts[postIndex].comments,
        {
          ...comment,
          createdAt: new Date(),
          replies: [],
        },
      ];

      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Saved Posts
      </Typography>
      {posts.length === 0 ? (
        <Typography variant="h6" align="center">
          You haven't saved any posts yet
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {posts.map((post) => (
            <PostComponent
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
              onComment={handleComment}
              onDelete={handleDeletePost}
            />
          ))}
        </Box>
      )}
    </Container>
  );
};
