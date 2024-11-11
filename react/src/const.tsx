export type UniMen = Record<string, { uid: string; name: string; order: number; twitter: string; type: string; birthday: string; debut: string }>;

// APIエンドポイント
// 本番
export const URL_BASE = "https://api.unidule.jp/prd/";
export const URL_HOST = "https://unidule.jp/";
export const URL_RES = "https://unidule.jp/res/";
export const URL_RAW = "https://unidule.jp/raw/";

// Dev
// export const URL_BASE = "https://d1ezxt9xzove4q.cloudfront.net/dev/";

export const channelParams: UniMen = {
  nanase: { uid: "UCFfKS52xZaus6HunxP3Owsw", name: "神白 ななせ", twitter: "nanase_k7", order: 0, type: "member", birthday: "07/07", debut: "04/19" },
  nagisa: { uid: "UCe5mbpYA9Yym4lZTdj06G6Q", name: "氷乃 渚", twitter: "hinonagi3", order: 1, type: "member", birthday: "12/21", debut: "04/19" },
  maru: { uid: "UCmB1E78Kdgd9z6hN3ONRKow", name: "花ノ木 まる", twitter: "hananoki_maru", order: 2, type: "member", birthday: "01/25", debut: "04/19" },
  ran: { uid: "UCVuVw2WDKIYCj9HABYVuREg", name: "黒花 蘭", twitter: "kurobanaran", order: 3, type: "member", birthday: "09/18", debut: "04/20" },
  roman: { uid: "UCbdOhaCW0Ti1qVCb9PKvmxg", name: "群青 ロマン", twitter: "GunjoRoman", order: 4, type: "member", birthday: "04/07", debut: "04/20" },
  ida: { uid: "UC7Ft50QAmUGWE6-ZfrHOG5Q", name: "扇名 いだ", twitter: "ouginaida", order: 5, type: "member", birthday: "11/15", debut: "04/20" },
  uniraid: { uid: "UCKofJjNEmQ3LwERp3pRVxtw", name: "ゆにれいど！", twitter: "Uniraid_VTuber", order: 6, type: "staff", birthday: "", debut: "" },
  uniraid_cut: { uid: "UCohnUVLcGInaC0l-2A95I5A", name: "公式 切り抜き", twitter: "", order: 7, type: "staff", birthday: "", debut: "" },
  other: { uid: "", name: "外部コラボ", twitter: "", order: 8, type: "ohter", birthday: "", debut: "" },
};
export const isMember = (channel: string): boolean => {
  const cid = channelParams[channel];
  return cid.type == "member";
};
export const getOrder = (channel: string): number => {
  const cid = channelParams[channel];
  return cid.order;
};
export const getFullName = (channel: string): string => {
  const cid = channelParams[channel];
  return cid.name;
};
export const getName = (idx: number): string => {
  for (let key in channelParams) {
    if (channelParams[key].order == idx) {
      return key;
    }
  }

  return "";
};

// メンバーのチャンネル識別子と名前の組み合わせを取得
export type ChannelAndName = { channel: string; name: string };
export const getChannelAndName = () => {
  const ret: ChannelAndName[] = [];
  for (let key in channelParams) {
    const c = channelParams[key];
    if (c.type == "member") {
      ret.push({ channel: key, name: c.name });
    }
  }

  return ret;
};

export type UniColors = Record<
  string,
  {
    bg_color: string;
    btn_color: string;
    btn_color_dark: string;
  }
>;

const GRAY = "rgb(186, 186, 186)";
export const uniColors: UniColors = {
  nanase: { bg_color: "rgb(181,190,254,0.2)", btn_color: "rgb(181,190,254)", btn_color_dark: GRAY }, // #b5befe
  nagisa: { bg_color: "rgb(119,168,226,0.2)", btn_color: "rgb(119,168,226)", btn_color_dark: GRAY }, // #77A8E2
  maru: { bg_color: "rgb(254,93,96,0.2)", btn_color: "rgb(254,93,96)", btn_color_dark: GRAY }, // #fe5d60
  ran: { bg_color: "rgb(112,5,2,0.2)", btn_color: "rgb(112,5,2)", btn_color_dark: GRAY }, // #700502
  roman: { bg_color: "rgb(76,215,252,0.2)", btn_color: "rgb(76,215,252)", btn_color_dark: GRAY }, // #4cd7fc
  ida: { bg_color: "rgb(255,84,0,0.2)", btn_color: "rgb(255,84,0)", btn_color_dark: GRAY }, // #FF5400
};

// カラーコードを取得
export const getUniBgColor = (channel: string): string => {
  const cid = uniColors[channel];
  return cid.bg_color;
};

// ボタンのカラーコードを取得
export const getUniBtnColor = (channel: string): string => {
  const cid = uniColors[channel];
  return cid.btn_color;
};

// 暗めのカラーコードを取得
export const getUniDarkColor = (channel: string): string => {
  const cid = uniColors[channel];
  return cid.btn_color_dark;
};

export const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (v, k) => k + start);
// ボイスのカテゴリー
export const voiceCaregory = [
  { value: "あいさつ", name: "あいさつ" },
  { value: "肯定", name: "肯定" },
  { value: "否定", name: "否定" },
  { value: "返事、リアクション", name: "返事、リアクション" },
  { value: "ツッコミ", name: "ツッコミ" },
  { value: "問いかけ、呼びかけ", name: "問いかけ、呼びかけ" },
  { value: "掛け声", name: "掛け声" },
  { value: "恫喝、罵倒、煽り", name: "恫喝、罵倒、煽り" },
  { value: "お礼", name: "お礼" },
  { value: "謝罪", name: "謝罪" },
  { value: "命令", name: "命令" },
  { value: "笑い", name: "笑い" },
  { value: "応援、褒め", name: "応援、褒め" },
  { value: "慰める", name: "慰める" },
  { value: "効果音、悲鳴、技", name: "効果音、悲鳴、技" },
  { value: "泣、弱", name: "泣、弱" },
  { value: "食べ物", name: "食べ物" },
  { value: "その他", name: "その他" },
];
