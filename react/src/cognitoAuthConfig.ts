export const oidcConfig = {
  authority: "https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_mlzSbKCqs",
  client_id: "31ub05906p3boaitnr64uubkte",
  //   redirect_uri: "https://unidule.jp/callback",
  redirect_uri: "http://localhost:3000/callback",
  response_type: "code",
  scope: "phone openid email profile",
};

export const signOutRedirect = () => {
  const clientId = "31ub05906p3boaitnr64uubkte";
  const logoutUri = "http://localhost:3000/logoutcallback";
  const cognitoDomain = "https://ap-northeast-1mlzsbkcqs.auth.ap-northeast-1.amazoncognito.com";
  window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
};
