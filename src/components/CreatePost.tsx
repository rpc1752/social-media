import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  TextField,
  IconButton,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "../contexts/AuthContext";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  // This is the maximum size we should allow for base64 storage in Firestore
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.includes("image/")) {
        setError("Only image files are allowed");
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError("File size must be less than 1MB for direct storage");
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setCaption("");
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      setError("Please select an image");
      return;
    }

    if (!user) {
      setError("You must be logged in to create a post");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Convert image to base64 string and store directly in Firestore
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);

      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          console.log("Image converted to base64, size:", base64String.length);

          if (base64String.length > 10000000) {
            setError(
              "Converted image is too large. Please use a smaller image."
            );
            setUploading(false);
            return;
          }

          // Create post document in Firestore with the base64 image directly
          const postData = {
            userId: user.uid,
            imageBase64: base64String,
            caption: caption.trim(),
            createdAt: Timestamp.now(),
            likes: [],
            comments: [],
            saves: [],
            fileName: imageFile.name,
            fileType: imageFile.type,
          };

          console.log("Creating post with data:", {
            ...postData,
            imageBase64: "[BASE64_STRING]",
          });
          const docRef = await addDoc(collection(db, "posts"), postData);
          console.log("Post created successfully with ID:", docRef.id);

          // Show success message and reset form
          setSuccess(true);
          setUploading(false);

          // Notify parent component
          if (onPostCreated) {
            console.log("Calling onPostCreated callback");
            onPostCreated();
          }

          setTimeout(() => {
            resetForm();
          }, 3000);
        } catch (error) {
          console.error("Error creating post:", error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
          setError("Failed to create post. Please try again.");
          setUploading(false);
        }
      };

      reader.onerror = () => {
        console.error("Error reading file as base64");
        setError(
          "Failed to process image. Please try again with a different image."
        );
        setUploading(false);
      };
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      setError("Failed to create post. Please try again.");
      setUploading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Post
      </Typography>

      {success && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "success.light",
            borderRadius: 1,
            color: "success.contrastText",
          }}
        >
          Post created successfully!
        </Box>
      )}

      {error && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "error.light",
            borderRadius: 1,
            color: "error.contrastText",
          }}
        >
          {error}
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          {imagePreview ? (
            <Box sx={{ position: "relative" }}>
              <IconButton
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
            </Box>
          ) : (
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{
                height: 120,
                width: "100%",
                border: "2px dashed grey.300",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              Upload Image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
              <Typography variant="caption" color="text.secondary">
                JPG, PNG, GIF (max 1MB)
              </Typography>
            </Button>
          )}
        </Box>

        <TextField
          fullWidth
          label="Caption"
          multiline
          rows={3}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          margin="normal"
        />

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button type="reset" onClick={resetForm} sx={{ mr: 1 }}>
            Reset
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={uploading || !imageFile}
            startIcon={
              uploading ? <CircularProgress size={20} color="inherit" /> : null
            }
          >
            {uploading ? "Uploading..." : "Post"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};
