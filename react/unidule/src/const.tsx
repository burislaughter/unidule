export type UniMen = Record<string, { uid: string; name: string; order: number; twitter: string; type: string; birthday: string; debut: string }>;

// APIエンドポイント
// 本番
export const URL_BASE = "https://api.unidule.jp/prd/";
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
};
