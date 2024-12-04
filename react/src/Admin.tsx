/** @jsxImportSource @emotion/react */
import { Box, Link, InputLabel, Input, Button, Typography, TextField, Select, MenuItem } from "@mui/material";
import { useCallback, useState } from "react";
import axios from "axios";
import { URL_BASE, channelParams } from "./const";
import BreadcrumbsEx from "./breadcrumbs";

const VIDEO_ONE_URL = URL_BASE + "video";
const AUTH_URL = URL_BASE + "auth";
const VIDEO_FORCE_UPDATE = URL_BASE + "video_force_update";
const YOUTUBE_VIDEO_URL = URL_BASE + "video";

type loginCredentials = {
  userName: string;
  password: string;
};

function Admin() {
  const [videoId, setVideoId] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [channel, setChannel] = useState("");

  const [credentials, setCredentials] = useState<loginCredentials>({
    userName: "",
    password: "",
  });

  axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
  axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

  // DynamoDBから検索
  const loadVideoInfo = useCallback(() => {
    const controller = new AbortController();

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const url = VIDEO_ONE_URL + "?id=" + videoId;
    axiosInstance
      .get(url, {
        signal: controller.signal,
      })
      .then((response) => {
        // 動画IDで検索した場合は一つ有効
        setVideoInfo(response.data[0]);
      })
      .catch((error) => {
        // エラーハンドリング
      });
  }, [videoId]);

  // Youtubeから検索
  const getYoutubeVideoInfo = useCallback(() => {
    const controller = new AbortController();

    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,

      headers: {
        // "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
    });

    const url = YOUTUBE_VIDEO_URL + "?video_id=" + videoId;
    axiosInstance
      .put(url, {
        data: {
          videoId: videoId,
        },
      })
      .then((response) => {
        // 動画IDで検索した場合は一つ有効
        // setVideoInfo(response.data[0]);
        console.log("Post OK");
      })
      .catch((error) => {
        // エラーハンドリング
        console.log("Post NG");
      });
  }, [videoId]);

  const deleteVideoInfo = useCallback(() => {
    const controller = new AbortController();

    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
    });

    const url = VIDEO_ONE_URL + "?id=" + videoId;
    axiosInstance
      .delete(url, {
        data: { videoId: videoId },
      })
      .then((response) => {
        // 動画IDで検索した場合は一つ有効
        // setVideoInfo(response.data[0]);
        console.log("Delete OK");
      })
      .catch((error) => {
        // エラーハンドリング
      });
  }, [videoId]);

  // 動画情報をYoutubeの情報で強制上書き
  const updateVideoInfo = useCallback(() => {
    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-api-key": apiKey,
      },
    });

    const url = VIDEO_FORCE_UPDATE + "?id=" + videoId + "&channel=" + channel;
    axiosInstance
      .get(url, {
        data: { videoId: videoId },
      })
      .then((response) => {
        // 動画IDで検索した場合は一つ有効
        // setVideoInfo(response.data[0]);
        console.log("UPDATE OK");
      })
      .catch((error) => {
        // エラーハンドリング
        console.log("UPDATE NG");
      });
  }, [videoId, channel]);

  // ログイン処理
  const login = (credentials: loginCredentials) => {
    const src = credentials.userName + ":" + credentials.password;
    const encode = btoa(src);
    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + encode,
      },
    });

    const url = AUTH_URL;
    axiosInstance
      .get(url)
      .then((response) => {
        // ログイン成功時にAPIキー払い出し
        setApiKey(response.data);
      })
      .catch((error) => {
        // エラーハンドリング
        console.log(error);
      });
  };
  // ログインボタンコールバック
  const onLogin = useCallback(() => {
    login(credentials);
  }, [credentials]);

  const handleChannelChange = (e: any) => {
    setChannel(e.target.value);
  };

  const MenuItems = () => {
    const list = Object.keys(channelParams).map((key, index) => {
      const c = channelParams[key];
      return <MenuItem value={key}>{c.name}</MenuItem>;
    });
    return list;
  };

  return (
    <Box sx={{ margin: 2, paddingTop: "72px" }}>
      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "管理ページ" },
        ]}
      ></BreadcrumbsEx>

      {apiKey == "" && (
        <Box>
          <Box>
            <Typography component="p" color="inherit" noWrap sx={{ marginBottom: 0.5 }}>
              ユーザーID
            </Typography>
            <TextField
              label=""
              variant="outlined"
              size="small"
              sx={{ marginBottom: 2 }}
              value={credentials.userName} //追加
              onChange={(e) =>
                setCredentials({
                  userName: e.target.value,
                  password: credentials.password,
                })
              } //追加
            />
            <Typography component="p" color="inherit" noWrap sx={{ marginBottom: 0.5 }}>
              パスワード
            </Typography>
            <TextField
              label=""
              variant="outlined"
              size="small"
              sx={{ marginBottom: 2 }}
              value={credentials.password} //追加
              onChange={(e) =>
                setCredentials({
                  userName: credentials.userName,
                  password: e.target.value,
                })
              } //追加
            />

            <Button variant="contained" onClick={onLogin}>
              ログイン
            </Button>
          </Box>
        </Box>
      )}
      {apiKey != "" && (
        <Box>
          <InputLabel>動画ID</InputLabel>
          <Input id="video-id" onChange={(event) => setVideoId(event.target.value)} />

          <Box>
            <InputLabel id="channel-select">チャンネル</InputLabel>
            <Select labelId="demo-simple-select-label" id="demo-simple-select" value={channel} label="チャンネル" onChange={handleChannelChange}>
              {MenuItems()}
            </Select>
          </Box>

          <Button variant="contained" onClick={loadVideoInfo}>
            検索
          </Button>
          <Button variant="contained" onClick={getYoutubeVideoInfo}>
            Youtube検索
          </Button>

          <Button variant="contained" onClick={deleteVideoInfo}>
            論理削除
          </Button>
          <Button variant="contained" onClick={updateVideoInfo}>
            強制アップデート
          </Button>
          <Typography sx={{ whiteSpace: "pre-wrap", backgroundColor: "#F0F0F0", marginTop: "10px" }}>{JSON.stringify(videoInfo, null, "\t")}</Typography>

          <Link href={"/"}>/index</Link>
          <Link href={"/sp/voice_button"}>/sp/voice_button</Link>
        </Box>
      )}
    </Box>
  );
}

export default Admin;
