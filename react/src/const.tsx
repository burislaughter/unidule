import { ToneAudioBuffer } from "tone";

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
  // EINS
  nanase: { uid: "UCFfKS52xZaus6HunxP3Owsw", name: "神白 ななせ", twitter: "nanase_k7", order: 0, type: "member", birthday: "07/07", debut: "2024/04/19" },
  nagisa: { uid: "UCe5mbpYA9Yym4lZTdj06G6Q", name: "氷乃 渚", twitter: "hinonagi3", order: 1, type: "member", birthday: "12/21", debut: "2024/04/19" },
  maru: { uid: "UCmB1E78Kdgd9z6hN3ONRKow", name: "花ノ木 まる", twitter: "hananoki_maru", order: 2, type: "member", birthday: "01/25", debut: "2024/04/19" },
  ran: { uid: "UCVuVw2WDKIYCj9HABYVuREg", name: "黒花 蘭", twitter: "kurobanaran", order: 3, type: "member", birthday: "09/18", debut: "2024/04/20" },
  roman: { uid: "UCbdOhaCW0Ti1qVCb9PKvmxg", name: "群青 ロマン", twitter: "GunjoRoman", order: 4, type: "member", birthday: "04/07", debut: "2024/04/20" },
  ida: { uid: "UC7Ft50QAmUGWE6-ZfrHOG5Q", name: "扇名 いだ", twitter: "ouginaida", order: 5, type: "member", birthday: "11/15", debut: "2024/04/20" },

  // ZWEI
  rabi: { uid: "UCpPkVnKaAqg9_conr8qAZjA", name: "卯埜 らび", twitter: "UnoRabi", order: 6, type: "member", birthday: "03/03", debut: "2024/11/29" },
  souta: { uid: "UCAS1tKQTTPVw4-TFnKTzvnw", name: "水上 蒼太", twitter: "mizukami_souta", order: 7, type: "member", birthday: "07/26", debut: "2024/11/29" },
  jyui: { uid: "UC3Wxd3RwdF-3gwt-Bud0oEQ", name: "甘成 じゅい", twitter: "amanari_jyui", order: 8, type: "member", birthday: "10/01", debut: "2024/11/29" },
  asuto: { uid: "UC_lfOFwTCIvZsuaSvJQpNXg", name: "翠星 アスト", twitter: "asuto_515", order: 9, type: "member", birthday: "05/15", debut: "2024/11/30" },
  hoguno: { uid: "UCJWTT5HZQbrkP1NUBwwVEbQ", name: "望月 ほぐの", twitter: "Hoguno_M", order: 10, type: "member", birthday: "09/06", debut: "2024/11/30" },
  konn: { uid: "UCaSJgx9BZRktT0s19henMGg", name: "坂本 こん", twitter: "Sakamoto_kon", order: 11, type: "member", birthday: "01/31", debut: "2024/11/30" },

  uniraid: { uid: "UCKofJjNEmQ3LwERp3pRVxtw", name: "ゆにれいど！", twitter: "Uniraid_VTuber", order: 12, type: "staff", birthday: "", debut: "" },
  uniraid_cut: { uid: "UCohnUVLcGInaC0l-2A95I5A", name: "公式 切り抜き", twitter: "", order: 13, type: "staff", birthday: "", debut: "" },
  other: { uid: "", name: "外部コラボ", twitter: "", order: 14, type: "ohter", birthday: "", debut: "" },
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

  rabi: { bg_color: "rgb(246,200,43,0.2)", btn_color: "rgb(246,200,43)", btn_color_dark: GRAY },
  souta: { bg_color: "rgb(33,96,213,0.2)", btn_color: "rgb(33,96,213)", btn_color_dark: GRAY },
  jyui: { bg_color: "rgb(248,205,223,0.2)", btn_color: "rgb(248,205,223)", btn_color_dark: GRAY },
  asuto: { bg_color: "rgb(175,209,201,0.2)", btn_color: "rgb(124,200,190)", btn_color_dark: GRAY },
  hoguno: { bg_color: "rgb(75,90,169,0.2)", btn_color: "rgb(75,90,169)", btn_color_dark: GRAY },
  konn: { bg_color: "rgb(252,84,2,0.2)", btn_color: "rgb(252,84,2)", btn_color_dark: GRAY },
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

/****************************************************************
 * AudioBuffer を Blob に変換
 ****************************************************************/
export const makeWav = (src: AudioBuffer | ToneAudioBuffer) => {
  const numOfChan = src.numberOfChannels;
  const length = src.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);

  const setUint16 = (view: DataView, offset: number, data: number) => {
    view.setUint16(offset, data, true);
    return offset + 2;
  };

  const setUint32 = (view: DataView, offset: number, data: number) => {
    view.setUint32(offset, data, true);
    return offset + 4;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    return offset + str.length;
  };

  // WAVEファイルのヘッダー作成
  let pos = 0;
  const view = new DataView(buffer);
  pos = writeString(view, pos, "RIFF"); // "RIFF"
  pos = setUint32(view, pos, length - 8); // file length - 8
  pos = writeString(view, pos, "WAVE"); // "WAVE"

  pos = writeString(view, pos, "fmt "); // "fmt " chunk
  pos = setUint32(view, pos, 16); // length = 16
  pos = setUint16(view, pos, 1); // PCM (uncompressed)
  pos = setUint16(view, pos, numOfChan);
  pos = setUint32(view, pos, src.sampleRate);
  pos = setUint32(view, pos, src.sampleRate * 2 * numOfChan); // avg. bytes/sec
  pos = setUint16(view, pos, numOfChan * 2); // block-align
  pos = setUint16(view, pos, 16); // 16-bit

  pos = writeString(view, pos, "data"); // "data" - chunk
  pos = setUint32(view, pos, length - pos - 4); // chunk length

  // write interleaved data
  const channels = [];
  for (let i = 0; i < src.numberOfChannels; i++) channels.push(src.getChannelData(i));

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      // 波形の再生位置ごとに左右のチャンネルのデータを設定していく
      const sample = Math.max(-1, Math.min(1, (channels[i] ?? [])[offset] ?? 0)); // 波形データを-1~1の間に丸め込む(おそらく最大最小を求め、全区間をその数で割って正規化するのが良いかも)
      const sample16bit = (0.5 + sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // 32bit不動小数点を16bit整数に丸め込む
      view.setInt16(pos, sample16bit, true); // データ書き込み
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });
};

export const timecodeToSecond = (time_str: string) => {
  const time_split = time_str.split(":");
  let hour = 0;
  let minute = 0;
  let second = 0;

  if (time_split.length == 3) {
    hour = Number(time_split[0]) * 60 * 60;
    minute = Number(time_split[1]) * 60;
    second = Number(time_split[2]);
  } else if (time_split.length == 2) {
    minute = Number(time_split[0]) * 60;
    second = Number(time_split[1]);
  } else if (time_split.length == 1) {
    //  秒だけ指定
    second = Number(time_split[0]);
  }

  return hour + minute + second;
};

// ボイスのカテゴリー
export const voiceCategory = [
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

// ユーザー権限の名前を引く
export const roleToName = (role: string) => {
  switch (role) {
    case "admin":
      return "管理者";
    case "poweruser":
      return "強力";
    case "guest":
      return "ゲスト";
    default:
      return "一般";
  }
};
