import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { Amplify, ResourcesConfig } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import { Box, Button, Typography } from "@mui/material";
import { fetchUserAttributes, FetchUserAttributesOutput } from "aws-amplify/auth";
import { useEffect, useState } from "react";

import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui";
import { formFields } from "./cognitoAuthConfig";
import { Navigate } from "react-router-dom";
const customTranslations = {
  ja: {
    "Code *": "認証コード",
    "Your passwords must match": "パスワードが一致しません",
    "Password must have at least 8 characters": "パスワードは8文字以上必要です",
    "Password did not conform with policy: Password must have uppercase characters": "パスワードには大文字を含める必要があります",
    "Password did not conform with policy: Password must have lowercase characters": "パスワードには小文字を含める必要があります",
    "Password did not conform with policy: Password must have numeric characters": "パスワードには数字を含める必要があります",
    "Password did not conform with policy: Password must have symbol characters": "パスワードには記号文字を含める必要があります",
  },
};
I18n.putVocabularies(translations);
I18n.putVocabularies(customTranslations);
I18n.setLanguage("ja");

const userPoolClientId = process.env.REACT_APP_USER_POOL_CLIENT_ID;
const userPoolId = process.env.REACT_APP_USER_POOL_ID;
if (!userPoolClientId || !userPoolId) {
  throw new Error("環境変数 REACT_APP_USER_POOL_CLIENT_ID または REACT_APP_USER_POOL_ID が設定されていません。");
}
const awsConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: userPoolClientId,
      userPoolId: userPoolId,
    },
  },
};
Amplify.configure(awsConfig);
function Login() {
  const { user, route } = useAuthenticator((context) => [context.user]);

  const [attr, setAttrResult] = useState<FetchUserAttributesOutput>();
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

  return (
    <Box sx={{ marginTop: "108px", flexGrow: 1, display: "flex", flexFlow: "column" }}>
      <Authenticator formFields={formFields}>{({ signOut, user }) => <Navigate replace to="/" />}</Authenticator>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Typography sx={{ margin: "4px", fontSize: "12px" }}>パスワードにはアルファベットの大文字、小文字、数字、記号が含まれている必要があります</Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          sx={{ marginTop: "12px", width: "80px", fontWeight: 600, fontSize: "16px" }}
          onClick={() => {
            window.history.back();
          }}
        >
          戻る
        </Button>
      </Box>
    </Box>
  );
}
export default Login;
