export const formFields = {
  signIn: {
    username: {
      label: "メールアドレス",
      order: 1,
    },
    password: {
      label: "パスワード:",

      isRequired: false,
      order: 2,
    },
  },
  signUp: {
    username: {
      label: "メールアドレス",
      placeholder: "メールアドレスを入力",
      order: 1,
    },
    nickname: {
      label: "表示名",
      placeholder: "表示名を設定",
      order: 2,
      isRequired: true,
    },
    password: {
      label: "パスワード:",

      isRequired: false,
      order: 3,
    },
    confirm_password: {
      label: "パスワード確認:",
      order: 4,
    },
  },
};
