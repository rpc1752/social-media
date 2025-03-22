import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardMedia,
  CardActions,
  CardContent,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  Bookmark,
  BookmarkBorder,
  Comment,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { Post as PostType, Comment as CommentType } from "../types";
import { formatDistanceToNow } from "date-fns";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

interface PostProps {
  post: PostType;
  onLike: (postId: string) => Promise<void>;
  onSave: (postId: string) => Promise<void>;
  onComment: (postId: string, comment: string) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
}

export const Post: React.FC<PostProps> = ({
  post,
  onLike,
  onSave,
  onComment,
  onDelete,
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const [replyText, setReplyText] = useState("");

  // Safely format dates to prevent RangeError
  const formatDate = (date: Date | any) => {
    // Make sure the date is valid before formatting
    if (date instanceof Date && !isNaN(date.getTime())) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return "recently"; // Default fallback
  };

  // Determine the image source (either URL or base64)
  const getImageSrc = () => {
    if (post.imageUrl) {
      return post.imageUrl;
    } else if (post.imageBase64) {
      return post.imageBase64;
    }
    return ""; // Fallback if neither is available
  };

  const handleLike = async () => {
    if (!user) return;
    await onLike(post.id);
  };

  const handleSave = async () => {
    if (!user) return;
    await onSave(post.id);
  };

  const handleComment = async () => {
    if (!user || !comment.trim()) return;
    await onComment(post.id, comment);
    setComment("");
  };

  const handleReply = async (commentId: string) => {
    if (!user || !replyText.trim()) return;

    try {
      const postRef = doc(db, "posts", post.id);

      // Find the comment in the post to reply to
      const updatedComments = [...post.comments];
      const commentIndex = updatedComments.findIndex((c) => c.id === commentId);

      if (commentIndex !== -1) {
        // Create new reply
        const replyId = uuidv4();
        const reply = {
          id: replyId,
          userId: user.uid,
          text: replyText,
          createdAt: Timestamp.now(),
          replies: [],
        };

        // Add reply to comment's replies array
        updatedComments[commentIndex].replies.push({
          ...reply,
          createdAt: new Date(),
        });

        // Update Firestore with the new comment structure
        await updateDoc(postRef, {
          comments: updatedComments.map((comment) => ({
            ...comment,
            createdAt: Timestamp.fromDate(comment.createdAt),
            replies: comment.replies.map((reply) => ({
              ...reply,
              createdAt:
                reply.createdAt instanceof Date
                  ? Timestamp.fromDate(reply.createdAt)
                  : reply.createdAt,
            })),
          })),
        });

        // Update local state with the updated comments
        const updatedPostComments = [...post.comments];
        updatedPostComments[commentIndex].replies.push({
          ...reply,
          createdAt: new Date(),
        });

        // Notify parent component about the update
        const updatedPost = { ...post, comments: updatedPostComments };
        onComment(post.id, "REPLY_UPDATE"); // Use a special flag to trigger a re-fetch
      }

      // Reset reply state
      setReplyText("");
      setReplyTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    await onDelete(post.id);
  };

  return (
    <Card sx={{ maxWidth: 600, mx: "auto", mb: 2 }}>
      <CardHeader
        avatar={<Avatar>{post.userId[0]}</Avatar>}
        title={post.userId}
        subheader={formatDate(post.createdAt)}
        action={
          user?.uid === post.userId && (
            <IconButton onClick={handleDelete}>
              <Delete />
            </IconButton>
          )
        }
      />
      {getImageSrc() && (
        <CardMedia
          component="img"
          height="400"
          image={getImageSrc()}
          alt="Post image"
        />
      )}
      {post.caption && (
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {post.caption}
          </Typography>
        </CardContent>
      )}
      <CardActions disableSpacing>
        <IconButton onClick={handleLike}>
          {post.likes.includes(user?.uid || "") ? (
            <Favorite color="error" />
          ) : (
            <FavoriteBorder />
          )}
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.likes.length} likes
        </Typography>
        <IconButton onClick={() => setShowComments(true)}>
          <Comment />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {post.comments.length} comments
        </Typography>
        <IconButton onClick={handleSave}>
          {post.saves?.includes(user?.uid || "") ? (
            <Bookmark />
          ) : (
            <BookmarkBorder />
          )}
        </IconButton>
      </CardActions>
      <CardContent>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleComment}
            disabled={!user || !comment.trim()}
          >
            Post
          </Button>
        </Box>
      </CardContent>

      <Dialog
        open={showComments}
        onClose={() => setShowComments(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Comments</DialogTitle>
        <DialogContent>
          <List>
            {post.comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{comment.userId[0]}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={comment.userId}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {comment.text}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption">
                          {formatDate(comment.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                  <Button size="small" onClick={() => setReplyTo(comment)}>
                    Reply
                  </Button>
                </ListItem>

                {/* Display replies with indentation */}
                {comment.replies && comment.replies.length > 0 && (
                  <Box sx={{ pl: 8 }}>
                    {comment.replies.map((reply) => (
                      <ListItem
                        key={reply.id}
                        alignItems="flex-start"
                        sx={{ py: 1 }}
                      >
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar sx={{ width: 28, height: 28 }}>
                            {reply.userId[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" component="span">
                              {reply.userId}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography component="span" variant="body2">
                                {reply.text}
                              </Typography>
                              <br />
                              <Typography component="span" variant="caption">
                                {formatDate(reply.createdAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </Box>
                )}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowComments(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reply to Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyTo(null)}>Cancel</Button>
          <Button
            onClick={() => replyTo && handleReply(replyTo.id)}
            variant="contained"
            disabled={!replyText.trim()}
          >
            Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};
