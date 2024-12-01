import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "react-oidc-context";

/************************************************
 / ログインボタン　
**************************************************/
function AuthButton() {
  const auth = useAuth();
  const signOutRedirect = () => {
    const clientId = "";
    const logoutUri = "http://localhost:3000";
    const cognitoDomain = "https://ap-northeast-11cjljsu5a.auth.ap-northeast-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <Box>Loading...</Box>;
  }

  if (auth.error) {
    return <Box>Encountering error... {auth.error.message}</Box>;
  }

  if (auth.isAuthenticated) {
    return (
      <Box>
        <Typography> Nickname: {auth.user?.profile.nickname} </Typography>
        {/* <Typography> email: {auth.user?.profile.email} </Typography>
        <Typography> ID Token: {auth.user?.id_token} </Typography>
        <Typography> Access Token: {auth.user?.access_token} </Typography>
        <Typography> Refresh Token: {auth.user?.refresh_token} </Typography> */}

        <Button color="inherit" onClick={() => signOutRedirect()}>
          LOGOUT
        </Button>
      </Box>
    );
  }

  return (
    <Button
      color="inherit"
      onClick={() => {
        auth.signinRedirect();
      }}
    >
      LOGIN
    </Button>
  );
}

export default AuthButton;
