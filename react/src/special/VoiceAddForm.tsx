import { Box, FormControl, InputLabel, FormHelperText, Button, Typography, TextField, Select, MenuItem, FormGroup, Stack, styled, SelectChangeEvent, IconButton, Alert, Link } from "@mui/material";
import useSound from "use-sound";
import { ChannelAndName, getChannelAndName, makeWav, URL_BASE, URL_HOST, URL_RAW, voiceCaregory } from "../const";
import "./VoiceAddForm.css";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Snackbar from "@mui/material/Snackbar";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DisabledByDefaultIcon from "@mui/icons-material/DisabledByDefault";
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import { Send as SendIcon, Close as CloseIcon, Margin } from "@mui/icons-material";
import { EditWave, EditWaveProps } from "./EditWave";
import useSWR from "swr";
import useMedia from "use-media";
import { ToneAudioBuffer } from "tone";

const FormData = require("form-data");

export type VoiceAddFormProps = {
  reloadFunc: any;
  selectVoice: any;
  isAdmin: boolean;
};

type FormInputType = {
  [key: string]: string;
};

type TError = {};

type TResponse = {
  response: TResponse | null;
  error: TError | null;
  loading: boolean;
};

const VOICE_LIST_URL = URL_BASE + "voice";
const RAW_VOICE_URL = URL_BASE + "raw_voice";
const RAW_VOICE_POOL_URL = URL_BASE + "raw_voice_pool";

export const fileToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (reader.result instanceof ArrayBuffer || reader.result == null) {
        reject(new Error("FileReader result is not an string"));
      } else {
        resolve(reader.result);
      }
    };
    reader.onerror = (e) => {
      reject(e);
    };
    reader.readAsDataURL(file);
  });
};

export const VoiceAddForm = ({ reloadFunc, selectVoice, isAdmin }: VoiceAddFormProps) => {
  const isMobile = useMedia({ minWidth: "600px" });
  const [uploadFileName, setUploadFileName] = useState<any>("音声ファイルは未選択です");
  const [channel, setChannel] = useState<string>(isAdmin ? selectVoice?.channel : "");
  const [sending, setSending] = useState<boolean>(false);
  const [category, setCategory] = useState<string>(isAdmin ? selectVoice?.category : "");
  const [url, setUrl] = useState<string>(isAdmin ? selectVoice?.url : "");
  const [title, setTitle] = useState<string>(isAdmin ? selectVoice?.title : "");
  const [startTC, setStartTC] = useState<string>(isAdmin ? selectVoice?.start : "");
  const [endTC, setEndTC] = useState<string>(isAdmin ? selectVoice?.end : "");
  const [pushTC, setPushTC] = useState(0);

  // const [waveBuffer, setWaveBuffer] = useState<Blob>();
  const [waveBuffer, setWaveBuffer] = useState<ToneAudioBuffer>();

  const [activeRegion, setActiveRegion] = useState<any>();

  const [rawVoiceUID, setRawVoiceUID] = useState<string>(""); // 監視するRAW音声ファイルのUID
  const [pollingInterval, setPollingInterval] = useState(0); // ポーリング間隔
  const [rawVoiceFileName, setRawVoiceFileName] = useState<string>(""); // s3にアップロードされたファイル名
  const [waveLen, setWaveLen] = useState<number>(0); // s3にアップロードされたファイル名
  const [rawVoiceGetProgress, setRawVoiceGetProgress] = useState<string>(""); // ファイルがs3に上がるまでは進捗ログ

  const [execMode, setExecMode] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<FormInputType>();

  // Formにwaveblobを入れるときの名前
  const waveblobReg = register("waveblob");

  const handleChangeChannel = (event: SelectChangeEvent) => {
    setChannel(event.target.value);
  };
  const handleChangeCategory = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  };

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [errorSnackOpen, setErrorSnackOpen] = useState<boolean>(false);

  const handleErrorSnackClose = () => {
    setErrorSnackOpen(false);
    setErrorMessage("");
  };
  const errorAction = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleErrorSnackClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const [succsesSnackOpen, setSuccsesSnackOpen] = useState<boolean>(false);
  const handleSuccsesSnackClose = () => {
    setSuccsesSnackOpen(false);
  };
  const succsesAction = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleSuccsesSnackClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const [errorYoutubeDlpOpen, setErrorYoutubeDlpOpen] = useState<boolean>(false);
  const handleErrorYoutubeDlpClose = () => {
    setErrorYoutubeDlpOpen(false);
    setErrorMessage("");
  };
  const errorYoutubeDlpAction = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleErrorYoutubeDlpClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const handleChageWaveEditRange = useCallback(
    (range: any) => {
      // 秒数計算
      const len = range.end - range.start;

      setWaveLen(Math.round(len * 10) / 10.0);
      setActiveRegion(range);
    },
    [setWaveLen]
  );

  useEffect(() => {
    if (isAdmin) {
      setValue("title", selectVoice?.title);
      setValue("channel", selectVoice?.channel);
      setValue("url", selectVoice?.archiveUrl);
      setValue("start", selectVoice?.start);
      setValue("end", selectVoice?.end);
    }
  }, [selectVoice?.title]);

  ////////////////////////////////////////////////////////////////////
  // 送信
  ////////////////////////////////////////////////////////////////////
  const onSubmit: SubmitHandler<FormInputType> = async (data) => {
    setSending(true);
    const formData = new FormData();

    // 音声の範囲の取得
    const buffer = waveBuffer?.slice(activeRegion.start, activeRegion.end)?.get();
    if (buffer != undefined) {
      const sliceBuffer = makeWav(buffer);
      formData.append("waveBuffer", await fileToBase64(sliceBuffer));
    }
    // カットしたWave
    // if (waveBuffer != undefined) {
    //   formData.append("waveBuffer", await fileToBase64(waveBuffer));
    // }

    for (const key of Object.keys(data)) {
      if (key == "file") {
        const file = data[key][0] as unknown as File;
        if (file != undefined) {
          const base64bin = await fileToBase64(file);
          formData.append(key, base64bin);
        }
      } else {
        formData.append(key, data[key]);
      }
    }

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "multipart/form-data",
        "Access-Control-Allow-Origin": "*",
      },
    });

    axiosInstance
      .post(VOICE_LIST_URL, formData)
      .then((w) => {
        console.log(w.data);
        setSuccsesSnackOpen(true);
        reloadFunc((f: number) => {
          return f + 1;
        });
        setSending(false);
      })
      .catch((err) => {
        console.log(err);
        setSending(false);

        if (err?.response?.data != undefined && err.response.status != undefined) {
          setErrorMessage(err.response.status + ":" + err?.response?.data);
        }
        setErrorSnackOpen(true);
        reloadFunc((f: number) => {
          return f + 1;
        });
      });
  };

  // 話者select
  const channelAndNames = getChannelAndName();
  const channelAndNamesComp: any[] = [];
  channelAndNames.forEach((cn: ChannelAndName) => {
    channelAndNamesComp.push(
      <MenuItem key={cn.name} value={cn.channel}>
        {cn.name}
      </MenuItem>
    );
  });
  channelAndNamesComp.push(
    <MenuItem key="misentaku" value={""}>
      未選択
    </MenuItem>
  );

  // カテゴリー選択
  const categoryComp: any[] = [];
  voiceCaregory.forEach((categ) => {
    categoryComp.push(
      <MenuItem key={categ.name} value={categ.value}>
        {categ.name}
      </MenuItem>
    );
  });

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
    whiteSpace: "nowrap",
    width: 1,
  });

  ////////////////////////////////////////////////////////////////
  // 音声データ取得 キャンセル処理
  /////////////////////////////////////////////////////////////////
  const onCancelGetRawVoice = () => {
    console.log("onCancelGetRawVoice");
    // ボタンをローディングへ
    setSending(false);
    setExecMode(0);
    setPollingInterval(0);
  };

  ////////////////////////////////////////////////////////////////
  // 音声データ取得ボタンCB
  /////////////////////////////////////////////////////////////////
  const handlerGetRawVoice = useCallback(() => {
    console.log(url);
    console.log(channel);
    console.log(startTC);
    console.log(endTC);

    if (url == "" && startTC == "" && channel == "") return;

    // ボタンをローディングへ
    setSending(true);

    setExecMode(0);

    const axiosInstance = axios.create({
      withCredentials: false,
    });

    // TODO: raw_voice で uid とチャンネルを返すようにする
    const api_url = RAW_VOICE_URL + "?video_url=" + encodeURIComponent(url) + "&start=" + startTC + "&end=" + endTC + "&channel=" + channel;
    axiosInstance
      .get(api_url)
      .then((w) => {
        console.log(w.data);

        // ダウンロードファイルUID取得
        setRawVoiceUID(w.data);

        // ポーリング開始
        setPollingInterval(1000);

        setExecMode(1);
      })
      .catch((err) => {
        setErrorYoutubeDlpOpen(true);
        setErrorMessage(err.message + "\n" + err.response.data != undefined ? err.response.data : err.response.data.message);
        setSending(false);
      });
  }, [url, channel, startTC, endTC, execMode]);

  // ポーリング実行関数
  const pollingFuncCB = useCallback(() => {
    if (rawVoiceUID == "" || channel == "" || execMode != 1) return;

    const axiosInstance = axios.create({
      withCredentials: false,
    });

    const api_url = RAW_VOICE_POOL_URL + "?uid=" + rawVoiceUID + "&channel=" + channel;

    axiosInstance
      .get(api_url)
      .then((w) => {
        console.log(w.data);

        if (w.data.filekey != null) {
          setSending(false);
          // WAVEファイルがアップロード成功したので波形エディタを起動する
          // raw/nagisa/e0018c3a-e7fd-48c4-87bc-024c3ef8b450_XeblyKyDgqI-740-750.wav
          setRawVoiceFileName(w.data.filekey);
          setPollingInterval(0);
          setExecMode(2);
          setRawVoiceGetProgress("");
        } else {
          // ファイルがs3に上がるまでは進捗ログをセット
          setRawVoiceGetProgress(w.data.progress);
        }
      })
      .catch((err) => {
        console.log(err);
        setSending(false);
      });
  }, [rawVoiceUID, channel, execMode]);

  // ポーリング実行Hools
  useSWR("dmy", pollingFuncCB, {
    refreshInterval: pollingInterval,
  });

  const EditWaveConpEx = useMemo(() => {
    return <EditWave url={URL_HOST + rawVoiceFileName} setBuffer={setWaveBuffer} setRange={handleChageWaveEditRange} />;
  }, [rawVoiceFileName, setWaveBuffer, handleChageWaveEditRange]);

  //クリップボードにコピー関数
  const cmdStr = `yt-dlp -x --audio-format wav --download-sections "*${selectVoice?.start}-${selectVoice?.end}" ${selectVoice?.archiveUrl} -o "${selectVoice?.title}.wav"`;
  const copyToClipboard = async () => {
    await global.navigator.clipboard.writeText(cmdStr);
  };

  const onDownload = () => {
    const anchor = document.createElement("a");
    anchor.setAttribute("href", `https://unidule.jp/res/${selectVoice?.channel}/${selectVoice?.filename}`);
    anchor.setAttribute("download", selectVoice?.filename);
    anchor.click();
  };

  return (
    <Box maxWidth="sm" sx={{ pt: 1, pb: 2 }}>
      <Typography
        align="center"
        variant="h2"
        sx={{
          fontSize: "3rem",
          "@media screen and (max-width:800px)": {
            fontSize: "2rem",
          },
        }}
      >
        音声追加申請フォーム
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", textAlign: "right" }}>このフォームから音声ボタンの追加をリクエストできます。</Typography>

      {isAdmin && (
        <>
          <Typography sx={{ marginTop: 4 }}>{cmdStr}</Typography>
          <Button onClick={copyToClipboard}>copy</Button>

          <Typography sx={{ marginTop: 4 }}>
            <Link href={`https://unidule.jp/res/${selectVoice?.channel}/${selectVoice?.filename}`} download={selectVoice?.filename}>
              DL
            </Link>
          </Typography>
        </>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          borderRadius: "12px",
          backgroundColor: "#E8FAF0",
          padding: 2,
          marginTop: 1,
        }}
      >
        <FormControl sx={{ marginBottom: 2, minWidth: 240 }}>
          <InputLabel id="channel-label">話者</InputLabel>
          <Select
            {...register("channel", { required: "話してる人を選んでください" })}
            labelId="channel-label"
            id="channel-select-helper"
            value={channel}
            label="channel"
            onChange={handleChangeChannel}
          >
            {channelAndNamesComp}
          </Select>
        </FormControl>

        <FormGroup>
          <TextField
            {...register("url", { required: "アーカイブのURLを入力してください" })}
            label={"アーカイブのURL " + (errors.url == undefined ? "" : "　(この項目は必須です)")}
            color="success"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <FormHelperText sx={{ marginLeft: 2 }}>例)https://www.youtube.com/watch?v=XeblyKyDgqI</FormHelperText>
          <FormHelperText sx={{ marginLeft: 2 }}>例)https://www.youtube.com/live/vaB3zk4ce_Y?si=WXslJ20sHe2n6LhZ</FormHelperText>
        </FormGroup>
        <FormGroup sx={{ marginTop: 2 }}>
          <Stack my={2} direction="row" justifyContent="start" spacing={0}>
            <TextField
              {...register("start", { required: "音声が動画に出た時間を入力してください" })}
              label={"音声が発声された時間" + (errors.url == undefined ? "" : "　(必須)")}
              color="success"
              value={startTC}
              onChange={(e) => setStartTC(e.target.value)}
            />
            <Box sx={{ position: "relative", margin: 0, paddingLeft: 2, paddingRight: 3 }}>
              <FormHelperText sx={{ position: "absolute", top: "50%", transform: " translate(0,-50%)" }}>～</FormHelperText>
            </Box>

            <TextField {...register("end")} value={endTC} label={"終了"} color="success" onChange={(e) => setEndTC(e.target.value)} />
          </Stack>

          <FormHelperText sx={{ marginLeft: 2 }}>「1:12:20」のようなタイムコード表記、または配信開始からの秒数</FormHelperText>
        </FormGroup>
        <FormGroup sx={{ marginTop: 2 }}>
          <TextField
            {...register("title", { required: "音声にタイトルを付けてください" })}
            label={"音声のタイトル" + (errors.title == undefined ? "" : "　(この項目は必須です)")}
            color="success"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormHelperText sx={{ marginLeft: 2 }}>例) 「大感謝ァ...」。この内容がボタンの表示になります</FormHelperText>
        </FormGroup>

        <FormControl sx={{ marginTop: 2 }}>
          <InputLabel id="category-label">カテゴリー</InputLabel>
          <Select {...register("tag")} labelId="category-label" id="category-select-helper" value={category} label="category" onChange={handleChangeCategory}>
            {categoryComp}
          </Select>
          <FormHelperText>あいさつ、肯定、問いかけ、悲鳴などの分類　（任意）</FormHelperText>
        </FormControl>

        <FormGroup sx={{ marginTop: 2 }}>
          <TextField {...register("comment")} label={"申し送り事項"} color="success" />
          <FormHelperText sx={{ marginLeft: 2 }}>何か伝えておきたいこと(任意)</FormHelperText>
        </FormGroup>

        <FormGroup sx={{ marginTop: 2 }}>
          <Controller
            control={control}
            name="file"
            defaultValue=""
            render={({ field: { onChange } }) => (
              <>
                <Stack my={2} direction="row" justifyContent="start" spacing={1}>
                  <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
                    MP3ファイルを選択
                    <VisuallyHiddenInput
                      type="file"
                      accept=".mp3"
                      onChange={(event) => {
                        if (event.target.files != null) {
                          setUploadFileName(event.target.files[0].name);
                          console.log(event.target.files);
                        } else {
                          console.log("filne null");
                        }

                        onChange(event.target.files);
                      }}
                    />
                  </Button>
                  <Stack direction="column" justifyContent="start">
                    <Typography component="span" sx={{ fontSize: "0.8rem", marginLeft: "10px", height: "20px", textAlign: "center", paddingX: 0 }}>
                      {uploadFileName}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", textAlign: "left", marginLeft: "8px" }}>MP3ファイルがある場合は添付できます。(任意)</Typography>
                  </Stack>
                </Stack>
              </>
            )}
          />
        </FormGroup>

        <Box sx={{ marginTop: 2 }}>
          <Typography>{waveLen} 秒/最大25秒まで</Typography>
          {/* WAVE編集 */}
          {rawVoiceFileName && <Box sx={{ margin: "1px" }}>{EditWaveConpEx}</Box>}
          <Stack direction={{ xs: "column", sm: "row" }}>
            <LoadingButton
              loading={sending}
              component="label"
              variant="contained"
              loadingPosition="start"
              tabIndex={-1}
              sx={{
                backgroundColor: "#EBC621",
                color: "#FFFFFF",
                fontSize: "1rem",
                "&:hover": { color: "#000000", backgroundColor: "#EBC621", mixBlendMode: "hard-light" },
              }}
              startIcon={<CloudUploadIcon />}
              onClick={handlerGetRawVoice}

              // onClick={() => {
              //   setRawVoiceFileName("raw/maru/283e1bea-1065-47f2-b4f4-51d58d11b295_TH6ALgqdreg-182-190.wav");
              //   setPushTC((c) => {
              //     return c + 1;
              //   });
              // }}
            >
              音声データの取得
            </LoadingButton>
            {sending && (
              <Button component="label" variant="contained" tabIndex={-1} endIcon={<DisabledByDefaultIcon />} sx={{ marginLeft: isMobile ? 1 : 0 }} onClick={onCancelGetRawVoice}>
                中断
              </Button>
            )}
          </Stack>

          {rawVoiceGetProgress && <Typography sx={{ fontSize: "0.8rem", color: "#333" }}>{rawVoiceGetProgress}</Typography>}

          <Typography sx={{ fontSize: "0.8rem" }}>アーカイブから音声を直接取得します</Typography>
          <Typography sx={{ fontSize: "0.8rem" }}>この機能は現在試験中です。</Typography>
          <Typography sx={{ fontSize: "0.8rem" }}>切り取る範囲が決まったら「決定」ボタンを押してからリクエストするボタンを押してください</Typography>
          <Typography sx={{ fontSize: "0.8rem" }}>音声の取得にはたまに5分くらいかかります</Typography>
          <Typography sx={{ fontSize: "0.8rem" }}>アップロードできる最大の長さは25秒程度です</Typography>
        </Box>

        <FormGroup>
          <Stack my={2} direction="row" justifyContent="end" spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }} key={"top-center-0"}>
              <Box key="1">
                <FormGroup>
                  <TextField {...register("delete_key")} label={"削除キー"} color="success" />
                  <FormHelperText sx={{ marginLeft: 2 }}>追加した音声を削除する場合に使用します</FormHelperText>
                </FormGroup>
              </Box>

              <Box key="2">
                <LoadingButton
                  loading={sending}
                  type="submit"
                  size="large"
                  loadingPosition="end"
                  variant="contained"
                  endIcon={<SendIcon />}
                  sx={{
                    minWidth: "120px",
                    backgroundColor: "#01AD73",
                    color: "#FFFFFF",
                    fontSize: "1rem",
                    "&:hover": { backgroundColor: "#01AD73", mixBlendMode: "hard-light" },
                  }}
                >
                  この内容でリクエストする
                </LoadingButton>
              </Box>
            </Stack>

            <Snackbar
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              autoHideDuration={3000}
              open={errorYoutubeDlpOpen}
              onClose={handleErrorYoutubeDlpClose}
              action={errorAction}
              key={"top-center-1"}
            >
              <Alert onClose={handleErrorYoutubeDlpClose} severity="error" sx={{ width: "100%" }}>
                <Typography>アーカイブから音声の取得に失敗しました</Typography>
                <Typography>{errorMessage}</Typography>
              </Alert>
            </Snackbar>

            <Snackbar
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              autoHideDuration={3000}
              open={errorSnackOpen}
              onClose={handleErrorSnackClose}
              action={errorAction}
              key={"top-center-2"}
            >
              <Alert onClose={handleSuccsesSnackClose} severity="error" sx={{ width: "100%" }}>
                <Typography>音声ボタンの追加リクエストに失敗しました</Typography>
                <Typography>{errorMessage}</Typography>
              </Alert>
            </Snackbar>
            <Snackbar
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
              autoHideDuration={3000}
              open={succsesSnackOpen}
              onClose={handleSuccsesSnackClose}
              action={succsesAction}
              key={"top-center-3"}
            >
              <Alert onClose={handleSuccsesSnackClose} severity="success" sx={{ width: "100%" }}>
                音声ボタンの追加リクエストに成功しました
              </Alert>
            </Snackbar>
          </Stack>
        </FormGroup>
      </Box>
      <Typography sx={{ fontSize: "0.6rem" }}>ゆにれいど！の切り抜きの規約では歌枠の切り抜きは雑談部分を含め禁止されています</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>音声の切り出しやノイズ除去は人力でやっています</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>
        リクエストした音声がいつまでたっても追加されない場合は、時間の指定等が間違っている可能性がありますので再申請するか、Xで管理者に聞いてみてください
      </Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>あまりにも無作為に追加(全ワード片っ端から追加するような)使い方は困りますので、そういう場合は独断で削除させていただきます</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>また不具合に遭遇した場合は、Xで報告をお願いします。</Typography>
    </Box>
  );
};
