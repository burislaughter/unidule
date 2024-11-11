import { Box, FormControl, InputLabel, FormHelperText, Button, Typography, TextField, Select, MenuItem, FormGroup, Stack, styled, SelectChangeEvent, IconButton, Alert } from "@mui/material";
import useSound from "use-sound";
import { ChannelAndName, getChannelAndName, URL_BASE, URL_HOST, URL_RAW, voiceCaregory } from "../const";
import "./VoiceAddForm.css";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import Snackbar from "@mui/material/Snackbar";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Fragment, useCallback, useState } from "react";
import axios from "axios";
import { LoadingButton } from "@mui/lab";
import { Send as SendIcon, Close as CloseIcon } from "@mui/icons-material";
import { EditWave } from "./EditWave";
import useSWR from "swr";

const FormData = require("form-data");

export type VoiceAddFormProps = {
  reloadFunc: any;
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

export const VoiceAddForm = ({ reloadFunc }: VoiceAddFormProps) => {
  const [uploadFileName, setUploadFileName] = useState<any>("音声ファイルは未選択です");
  const [channel, setChannel] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [startTC, setStartTC] = useState<string>("");

  const [rawVoiceUID, setRawVoiceUID] = useState<string>(""); // 監視するRAW音声ファイルのUID
  const [pollingInterval, setPollingInterval] = useState(0); // ポーリング間隔
  const [rawVoiceFileName, setRawVoiceFileName] = useState<string>(""); // s3にアップロードされたファイル名

  const [execMode, setExecMode] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormInputType>();

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

  // 送信
  const onSubmit: SubmitHandler<FormInputType> = async (data) => {
    setSending(true);
    const formData = new FormData();
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
        setSending(false);
        setSuccsesSnackOpen(true);
        reloadFunc((f: number) => {
          return f + 1;
        });
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

  // 音声データ取得ボタンCB
  const handlerGetRawVoice = useCallback(() => {
    console.log(url);
    console.log(channel);
    console.log(startTC);

    setExecMode(0);

    const axiosInstance = axios.create({
      withCredentials: false,
    });

    const api_url = RAW_VOICE_URL + "?video_url=" + encodeURIComponent(url) + "&start=" + startTC + "&channel=" + channel;
    axiosInstance
      .get(api_url)
      .then((w) => {
        console.log(w.data);
        setSending(false);

        // ダウンロードファイルUID取得
        setRawVoiceUID(w.data);

        // ポーリング開始
        setPollingInterval(1000);

        setExecMode(1);
      })
      .catch((err) => {
        console.log(err);
        setSending(false);
      });
  }, [url, channel, startTC, execMode]);

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
        setSending(false);

        if (w.data.filekey != null) {
          // WAVEファイルがアップロード成功したので波形エディタを起動する
          // raw/nagisa/e0018c3a-e7fd-48c4-87bc-024c3ef8b450_XeblyKyDgqI-740-750.wav
          setRawVoiceFileName(w.data);
          setPollingInterval(0);
          setExecMode(2);
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
        <FormControl sx={{ marginBottom: 2, minWidth: 120 }}>
          <InputLabel id="channel-label">話者</InputLabel>
          <Select {...register("channel")} labelId="channel-label" id="channel-select-helper" value={channel} label="channel" onChange={handleChangeChannel}>
            {channelAndNamesComp}
          </Select>
          <FormHelperText>未選択の場合は、アーカイブがあるチャンネルになります</FormHelperText>
        </FormControl>

        <FormGroup>
          <TextField
            {...register("url", { required: "アーカイブのURLを入力してください" })}
            label={"アーカイブのURL " + (errors.url == undefined ? "" : "　(この項目は必須です)")}
            color="success"
            onChange={(e) => setUrl(e.target.value)}
          />
          <FormHelperText sx={{ marginLeft: 2 }}>例)https://www.youtube.com/watch?v=XeblyKyDgqI</FormHelperText>
          <FormHelperText sx={{ marginLeft: 2 }}>例)https://www.youtube.com/live/vaB3zk4ce_Y?si=WXslJ20sHe2n6LhZ</FormHelperText>
        </FormGroup>
        <FormGroup sx={{ marginTop: 2 }}>
          <TextField {...register("start")} label={"音声が発声された時間"} color="success" onChange={(e) => setStartTC(e.target.value)} />
          <FormHelperText sx={{ marginLeft: 2 }}>「1:12:20」のようなタイムコード表記、または配信開始からの秒数</FormHelperText>
        </FormGroup>
        <FormGroup sx={{ marginTop: 2 }}>
          <TextField
            {...register("title", { required: "音声が動画に出た時間を入力してください" })}
            label={"音声のタイトル" + (errors.title == undefined ? "" : "　(この項目は必須です)")}
            color="success"
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
          <Button
            component="label"
            variant="contained"
            tabIndex={-1}
            sx={{
              backgroundColor: "#EBC621",
              color: "#FFFFFF",
              fontSize: "1rem",
              "&:hover": { color: "#000000", backgroundColor: "#EBC621", mixBlendMode: "hard-light" },
            }}
            startIcon={<CloudUploadIcon />}
            onClick={handlerGetRawVoice}
          >
            音声データの取得
          </Button>
        </Box>

        <Box sx={{ marginTop: 2 }}>
          {/* WAVE編集 */}
          {rawVoiceFileName && (
            <Box sx={{ margin: "1px" }}>
              <EditWave channel={channel} title={title} url={URL_HOST + rawVoiceFileName} />
              {/* <Typography>aaaaa</Typography> */}
            </Box>
          )}

          <Button
            component="label"
            variant="contained"
            tabIndex={-1}
            sx={{
              backgroundColor: "#EBC621",
              color: "#FFFFFF",
              fontSize: "1rem",
              "&:hover": { color: "#000000", backgroundColor: "#EBC621", mixBlendMode: "hard-light" },
            }}
            startIcon={<CloudUploadIcon />}
            onClick={() => {
              const controller = new AbortController();

              axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
              axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";
              const axiosInstance = axios.create({
                withCredentials: false,
                headers: {
                  "Content-Type": "application/json",
                  "Access-Control-Allow-Origin": "*",
                },
              });

              // const api_url = RAW_VOICE_POOL_URL + "?uid=" + rawVoiceUID + "&channel=" + channel;
              const api_url = "https://api.unidule.jp/prd/raw_voice_pool?uid=4a3d654d-7a7a-422e-95a1-1c3f7c51413e&channel=nagisa";

              axiosInstance
                .get(api_url, {
                  signal: controller.signal,
                })
                .then((w) => {
                  console.log(w.data);
                  setSending(false);

                  // WAVEファイルがアップロード成功したので波形エディタを起動する
                  // raw/nagisa/e0018c3a-e7fd-48c4-87bc-024c3ef8b450_XeblyKyDgqI-740-750.wav
                  setRawVoiceFileName(w.data.filekey);
                })
                .catch((err) => {
                  console.log(err);
                  setSending(false);
                });
            }}
          >
            音声データの確認
          </Button>
        </Box>

        <FormGroup>
          <Stack my={2} direction="row" justifyContent="end" spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2, md: 4 }}>
              <Box>
                <FormGroup>
                  <TextField {...register("delete_key")} label={"削除キー"} color="success" />
                  <FormHelperText sx={{ marginLeft: 2 }}>追加した音声を削除する場合に使用します</FormHelperText>
                </FormGroup>
              </Box>

              <Box>
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
              open={errorSnackOpen}
              onClose={handleErrorSnackClose}
              action={errorAction}
              key={"top-center-1"}
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
              key={"top-center-2"}
            >
              <Alert onClose={handleSuccsesSnackClose} severity="success" sx={{ width: "100%" }}>
                音声ボタンの追加リクエストに成功しました
              </Alert>
            </Snackbar>
          </Stack>
        </FormGroup>
      </Box>
      <Typography sx={{ fontSize: "0.6rem" }}>ゆにれいど！の切り抜きの規約では歌枠の切り抜きは雑談部分を含め禁止されています</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>音声の切り出しは人力でやっています</Typography>
      <Typography sx={{ fontSize: "0.6rem" }}>いつまでたっても追加されない場合は、時間の指定等が間違っている可能性がありますので再申請するか、Xで管理者に聞いてみてください</Typography>
    </Box>
  );
};
