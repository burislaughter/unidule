import { VFC } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { CircularProgress } from "@mui/material";
import { PATH_LOCAL_STORAGE_KEY } from "./RouteAuthGuard";

/**
 * 認証後のCallbackエンドポイント
 */
export const LogoutCallback: VFC = () => {
  const auth = useAuth();

  if (auth.isLoading) {
    return <CircularProgress />; // ローディングコンポーネント
  }

  // // ログイン前にアクセスしようとしていたパスがあれば取得してリダイレクト
  // const redirectLocation = localStorage.getItem(PATH_LOCAL_STORAGE_KEY);
  // localStorage.removeItem(PATH_LOCAL_STORAGE_KEY);

  return <Navigate to={"/"} replace />;
};

export default LogoutCallback;
