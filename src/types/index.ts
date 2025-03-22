export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface Post {
  id: string;
  userId: string;
  imageUrl?: string; // URL for Firebase Storage images
  imageBase64?: string; // Base64 data for directly stored images
  caption?: string; // Optional caption for posts
  createdAt: Date;
  likes: string[];
  comments: Comment[];
  saves: string[];
  fileName?: string; // Original file name
  fileType?: string; // File MIME type
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: Date;
  replies: Comment[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
}
