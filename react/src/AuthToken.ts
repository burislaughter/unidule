import { User } from "oidc-client-ts";
import { oidcConfig } from "./cognitoAuthConfig";

export type AuthToken = {
  token: string;
  expiredAt: number | undefined;
};

export const getAuthToken = (): AuthToken | null => {
  const oidcData = sessionStorage.getItem(`oidc.user:${oidcConfig.authority}:${oidcConfig.client_id}`);

  if (!oidcData) {
    return null;
  }

  const authUser = User.fromStorageString(oidcData);

  return !authUser
    ? null
    : {
        token: authUser.access_token, // アクセストークン
        expiredAt: authUser.expires_at, // 有効期限
      };
};
