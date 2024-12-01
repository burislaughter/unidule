export const oidcConfig = {
  authority: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_mlzSbKCqs",
  client_id: "",
  //   redirect_uri: "https://unidule.jp/callback",
  redirect_uri: "http://localhost:3000/callback",
  response_type: "code",
  scope: "phone openid email profile",
};
