import { CircularProgress } from "@mui/material";
import { ReactNode, VFC } from "react";
import { useAuth } from "react-oidc-context";
import { useLocation } from "react-router-dom";

export const PATH_LOCAL_STORAGE_KEY = "path";

type Props = {
  component: ReactNode;
};

/**
 * 認証ありのRouteガード
 */
export const RouteAuthGuard: VFC<Props> = ({ component }) => {
  // 認証情報にアクセスするためのhook
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <CircularProgress />; // ローディングコンポーネント
  }

  if (auth.error) {
    throw new Error("unauthorized"); // 要件に応じて実装を見直すこと
  }

  // 認証されていなかったらリダイレクトさせる前にアクセスされたパスを残しておく
  if (!auth.isAuthenticated) {
    // localStorage.setItem(PATH_LOCAL_STORAGE_KEY, location.pathname);
    auth.signinRedirect();
  }

  return <>{component}</>;
};

export default RouteAuthGuard;
