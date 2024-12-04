import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { signOutRedirect } from "./cognitoAuthConfig";

function Auth() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <Box>Loading...</Box>;
  }

  if (auth.error) {
    return <Box>Encountering error... {auth.error.message}</Box>;
  }

  const role = (auth.user?.profile as unknown as any)["custom:role"];

  if (auth.isAuthenticated) {
    return (
      <Box sx={{ marginTop: "72px" }}>
        <Typography> role: {role} </Typography>
        <Typography> email: {auth.user?.profile.email} </Typography>
        <Typography> Nickname: {auth.user?.profile.nickname} </Typography>
        <Typography> ID Token: {auth.user?.id_token} </Typography>
        <Typography> Access Token: {auth.user?.access_token} </Typography>
        <Typography> Refresh Token: {auth.user?.refresh_token} </Typography>

        <Button
          onClick={() => {
            auth.removeUser();
          }}
        >
          removeUser
        </Button>

        <Button
          onClick={() => {
            auth.removeUser();
            signOutRedirect();
          }}
        >
          Sign out
        </Button>
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
      <Button
        onClick={() => {
          signOutRedirect();
        }}
      >
        Sign out
      </Button>
    </Box>
  );
}

export default Auth;
