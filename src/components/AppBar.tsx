import React, { useState } from "react";
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";

export const AppBar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
      handleClose();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <MuiAppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid #eeeeee",
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1, sm: 2 } }}>
        {/* Logo for larger screens or menu button for mobile */}
        {isMobile ? (
          <IconButton edge="start" color="inherit" onClick={handleMenu}>
            <MenuIcon />
          </IconButton>
        ) : (
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontFamily: "Verdana, sans-serif",
              fontWeight: 700,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            SocialShare
          </Typography>
        )}

        {/* Main navigation */}
        {user ? (
          <>
            {/* Desktop navigation */}
            {!isMobile && (
              <Box sx={{ display: "flex", gap: 4 }}>
                <IconButton
                  component={Link}
                  to="/"
                  color={isActive("/") ? "primary" : "default"}
                >
                  <HomeIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/search"
                  color={isActive("/search") ? "primary" : "default"}
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/create"
                  color={isActive("/create") ? "primary" : "default"}
                >
                  <AddIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/activity"
                  color={isActive("/activity") ? "primary" : "default"}
                >
                  <FavoriteIcon />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/my-posts"
                  color={isActive("/my-posts") ? "primary" : "default"}
                >
                  <PersonIcon />
                </IconButton>
              </Box>
            )}

            {/* Mobile bottom navigation displayed as fixed footer */}
            {isMobile && (
              <Box
                sx={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  justifyContent: "space-around",
                  backgroundColor: "background.paper",
                  borderTop: "1px solid #eeeeee",
                  py: 1,
                  height: "60px",
                  zIndex: theme.zIndex.appBar,
                }}
              >
                <IconButton
                  component={Link}
                  to="/"
                  color={isActive("/") ? "primary" : "default"}
                  size="small"
                >
                  <HomeIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/search"
                  color={isActive("/search") ? "primary" : "default"}
                  size="small"
                >
                  <SearchIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/create"
                  color={isActive("/create") ? "primary" : "default"}
                  size="small"
                >
                  <AddIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/activity"
                  color={isActive("/activity") ? "primary" : "default"}
                  size="small"
                >
                  <FavoriteIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  component={Link}
                  to="/my-posts"
                  color={isActive("/my-posts") ? "primary" : "default"}
                  size="small"
                >
                  <PersonIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Box>
            )}

            {/* User avatar and menu */}
            <Box>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.displayName ? user.displayName[0] : "U"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem component={Link} to="/my-posts" onClick={handleClose}>
                  Profile
                </MenuItem>
                <MenuItem
                  component={Link}
                  to="/saved-posts"
                  onClick={handleClose}
                >
                  Saved Posts
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              component={Link}
              to="/login"
              sx={{
                borderRadius: 20,
                px: 3,
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              component={Link}
              to="/register"
              sx={{
                borderRadius: 20,
                px: 3,
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </MuiAppBar>
  );
};
