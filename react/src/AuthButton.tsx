import { WindowSharp } from "@mui/icons-material";
import { Box, Button, Menu, MenuItem, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
/************************************************
 / ログインボタン　
**************************************************/
function AuthButton() {
  const auth = useAuth();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const signOutRedirect = () => {
    const clientId = "31ub05906p3boaitnr64uubkte";
    const logoutUri = "http://localhost:3000/logoutcallback";
    const cognitoDomain = "https://ap-northeast-1mlzsbkcqs.auth.ap-northeast-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };
  if (auth.isLoading) {
    return <Box>Loading...</Box>;
  }

  if (auth.error) {
    return <Box>Encountering error... {auth.error.message}</Box>;
  }

  const prof = auth.user?.profile as unknown as any;
  const role = prof === undefined ? undefined : prof["custom:role"];
  console.log("auth.isAuthenticated:" + auth.isAuthenticated);
  if (auth.isAuthenticated) {
    return (
      <Box>
        <Button onClick={handleMenu} sx={{ color: "#FFFFFF", textTransform: "none" }}>
          User: {auth.user?.profile.nickname}
        </Button>
        {/* <Typography> email: {auth.user?.profile.email} </Typography>
        <Typography> ID Token: {auth.user?.id_token} </Typography>
        <Typography> Access Token: {auth.user?.access_token} </Typography>
        <Typography> Refresh Token: {auth.user?.refresh_token} </Typography> */}

        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              // マイページへ
              window.location.href = `/mypage`;
            }}
          >
            マイページ
          </MenuItem>

          {role === "admin" && (
            <MenuItem
              onClick={() => {
                // マイページへ
                window.location.href = `/admin`;
              }}
            >
              管理ページ
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              auth.removeUser();
              signOutRedirect();
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Button
      sx={{ color: "#FFFFFF", textTransform: "none" }}
      onClick={() => {
        auth.signinRedirect();
      }}
    >
      Login
    </Button>
  );
}

export default AuthButton;
