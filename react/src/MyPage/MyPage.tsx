import { Box, Breadcrumbs, Button, CircularProgress, Link, Typography } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { signOutRedirect } from "../cognitoAuthConfig";
import BreadcrumbsEx from "../breadcrumbs";
import { title } from "process";

function MyPage() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <CircularProgress />; // ローディングコンポーネント
  }

  if (auth.error) {
    throw new Error("unauthorized"); // 要件に応じて実装を見直すこと
  }

  // 未ログイン
  if (!auth.isAuthenticated) {
    return (
      <Box sx={{ marginTop: "64px", marginLeft: "8px" }}>
        <Button
          onClick={() => {
            auth.signinRedirect();
          }}
        >
          ログインする
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ paddingTop: "72px", marginLeft: "8px" }}>
      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "マイページ" },
        ]}
      ></BreadcrumbsEx>
      <Box>Login中</Box>
      <Box></Box>
    </Box>
  );
}

export default MyPage;
