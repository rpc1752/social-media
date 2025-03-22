import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  Fade,
  useTheme,
} from "@mui/material";
import InfiniteScroll from "react-infinite-scroll-component";
import { Post as PostComponent } from "../components/Post";
import { CreatePost } from "../components/CreatePost";
import { Post } from "../types";
import { useAuth } from "../contexts/AuthContext";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

export const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const theme = useTheme();

  const fetchPosts = async () => {
    try {
      console.log("Starting to fetch posts...");
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      console.log("Query created:", postsQuery);
      const postsSnapshot = await getDocs(postsQuery);
      console.log(
        "Raw snapshot data:",
        postsSnapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))
      );

      if (postsSnapshot.empty) {
        console.log("No posts found in snapshot");
        setHasMore(false);
        setLoading(false);
        return;
      }

      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);

      const postsData = postsSnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Processing post:", { id: doc.id, data });
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

      console.log("Processed posts data:", postsData);
      setPosts(postsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching posts:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      setLoading(false);
    }
  };

  const fetchMorePosts = async () => {
    if (!lastVisible) return;

    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(5)
      );
      const postsSnapshot = await getDocs(postsQuery);

      if (postsSnapshot.empty) {
        setHasMore(false);
        return;
      }

      const lastVisibleDoc = postsSnapshot.docs[postsSnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc);

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

      setPosts([...posts, ...postsData]);
    } catch (error) {
      console.error("Error fetching more posts:", error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

      const updatedPosts = [...posts];
      if (isSaved) {
        updatedPosts[postIndex].saves = updatedPosts[postIndex].saves.filter(
          (id) => id !== user.uid
        );
      } else {
        updatedPosts[postIndex].saves = [
          ...updatedPosts[postIndex].saves,
          user.uid,
        ];
      }

      setPosts(updatedPosts);
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

  const handlePostCreated = () => {
    console.log("Post created, refreshing feed...");
    // Reset scroll position
    setLastVisible(null);
    setHasMore(true);
    // Fetch posts again
    fetchPosts();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Fade in timeout={800}>
        <Box>
          {user && (
            <Box sx={{ mb: 4, borderRadius: 2, overflow: "hidden" }}>
              <CreatePost onPostCreated={handlePostCreated} />
            </Box>
          )}

          {posts.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[1],
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                No posts available yet
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 1,
                }}
              >
                Be the first to share something!
              </Typography>
            </Box>
          ) : (
            <InfiniteScroll
              dataLength={posts.length}
              next={fetchMorePosts}
              hasMore={hasMore}
              loader={
                <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                  <CircularProgress size={30} />
                </Box>
              }
              endMessage={
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    opacity: 0.7,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 500,
                    }}
                  >
                    You've reached the end 🎉
                  </Typography>
                </Box>
              }
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  "& > *": {
                    transition:
                      "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: theme.shadows[4],
                    },
                  },
                }}
              >
                {posts.map((post) => (
                  <Fade key={post.id} in timeout={500}>
                    <Box>
                      <PostComponent
                        post={post}
                        onLike={handleLike}
                        onSave={handleSave}
                        onComment={handleComment}
                        onDelete={handleDeletePost}
                      />
                    </Box>
                  </Fade>
                ))}
              </Box>
            </InfiniteScroll>
          )}
        </Box>
      </Fade>
    </Container>
  );
};
