import { Box, Button, Menu, MenuItem, styled, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes, FetchUserAttributesOutput } from "aws-amplify/auth";

const StyledButton = styled(Button)`
  color: #2a8387;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 4px 20px 4px;
  outline: 0;
  border: 1px solid #2a8387;
  cursor: pointer;
  position: relative;
  background-color: rgba(0, 0, 0, 0);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  :after {
    content: "";
    background-color: #c2fbd7;
    width: 100%;
    z-index: -1;
    position: absolute;
    height: 100%;
    transition: 0.2s;
    top: 0px;
    left: 0px;
  }
  :hover:after {
    top: 8px;
    left: 7px;
  }
`;

/************************************************
 / ログインボタン　
**************************************************/
function AuthButton() {
  const { user, authStatus, route, signOut } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [attr, setAttrResult] = useState<FetchUserAttributesOutput>();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getCurrentUserAsync = async () => {
    const result = await fetchUserAttributes();
    console.log(result);
    setAttrResult(result);
  };
  useEffect(() => {
    if (user) {
      getCurrentUserAsync();
    }
  }, [user]);

  const role = attr === undefined ? "" : attr["custom:role"];

  // ログアウト実行
  async function handleSignOut() {
    await signOut();
  }

  if (window.location.pathname === "/login") {
    return <></>;
  }

  if (authStatus === "authenticated") {
    return (
      <Box>
        <StyledButton onClick={handleMenu}>User: {attr === undefined ? "" : attr["nickname"]}</StyledButton>

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

          {(role === "admin" || role === "poweruser") && (
            <MenuItem
              onClick={() => {
                // 管理
                window.location.href = `/admin`;
              }}
            >
              管理ページ
            </MenuItem>
          )}
          <MenuItem onClick={handleSignOut}>Logout</MenuItem>
        </Menu>
      </Box>
    );
  }

  // ログインしていなかった場合はログイン画面に遷移するリンクとして機能する
  return (
    <StyledButton
      onClick={() => {
        window.location.href = `/login`;
      }}
    >
      Login
    </StyledButton>
  );
}

export default AuthButton;
