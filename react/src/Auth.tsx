import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "react-oidc-context";

function Auth() {
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
        <Typography> email: {auth.user?.profile.email} </Typography>
        <Typography> Nickname: {auth.user?.profile.nickname} </Typography>
        <Typography> ID Token: {auth.user?.id_token} </Typography>
        <Typography> Access Token: {auth.user?.access_token} </Typography>
        <Typography> Refresh Token: {auth.user?.refresh_token} </Typography>

        <Button onClick={() => auth.removeUser()}>Sign out</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        onClick={() => {
          auth.signinRedirect();
        }}
      >
        Sign in
      </Button>
      <Button onClick={() => signOutRedirect()}>Sign out</Button>
    </Box>
  );
}

export default Auth;
