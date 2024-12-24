import { Box, Button, CircularProgress, styled, Table, TableBody, TableCell, TableContainer, TableRow, Paper, TableHead } from "@mui/material";
import BreadcrumbsEx from "../breadcrumbs";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserAttributes, FetchUserAttributesOutput } from "aws-amplify/auth";
import { roleToName } from "../const";

function MyPage() {
  const { user, authStatus, route } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [attr, setAttrResult] = useState<FetchUserAttributesOutput>();

  const [nickname, setNickname] = useState<string | undefined>("");
  const [email, setEmail] = useState<string | undefined>("");
  const [role, setRole] = useState<string | undefined>("");

  const getCurrentUserAsync = async () => {
    const attr = await fetchUserAttributes();
    setAttrResult(attr);

    if (attr !== undefined) {
      // 表示名
      setNickname(attr["nickname"]);
      // メールアドレス
      setEmail(attr["email"]);
      // 権限
      setRole(attr["custom:role"]);
    }
  };

  useEffect(() => {
    if (user) {
      getCurrentUserAsync();
    }
  }, [user]);

  if (authStatus === "configuring") {
    return <CircularProgress />; // ローディングコンポーネント
  }

  // 未ログインの場合はトップページに遷移
  if (authStatus !== "authenticated") {
    return <Navigate replace to="/" />;
  }

  const headerData = ["ユーザーID", "表示名", "メールアドレス", "権限"];
  const userData = [user?.userId, nickname, email, roleToName(role!)];

  return (
    <Box sx={{ paddingTop: "72px", marginLeft: "8px" }}>
      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "マイページ" },
        ]}
      ></BreadcrumbsEx>
      <Box sx={{ padding: "10px", margin: "10px", backgroundColor: "#F5F5F5" }}>
        <TableContainer component={Paper} sx={{ margin: "20px", width: "480px", backgroundColor: "#FFF" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ユーザー情報</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {userData?.map((value, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row" style={{ width: "30%" }}>
                    {headerData[index]}
                  </TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box></Box>
    </Box>
  );
}

export default MyPage;
