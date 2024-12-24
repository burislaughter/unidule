/** @jsxImportSource @emotion/react */
import { Box, Link, InputLabel, Input, Button, Typography, TextField, Select, MenuItem, CircularProgress, Stack, Tab } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { URL_BASE, UniMen, channelParams } from "../const";
import BreadcrumbsEx from "../breadcrumbs";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Navigate } from "react-router-dom";
import { addDays, format, formatDistance, sub } from "date-fns";
import { TabPanelEx } from "../styled";
import { TabContext, TabList } from "@mui/lab";
import { SiSlack } from "react-icons/si";
import { FaYoutube } from "react-icons/fa";

const VIDEO_ONE_URL = URL_BASE + "video";
const AUTH_URL = URL_BASE + "auth";
const VIDEO_FORCE_UPDATE = URL_BASE + "video_force_update";
const CHAT_SEARCH_URL = URL_BASE + "chat_search";

type loginCredentials = {
  userName: string;
  password: string;
};

function Admin() {
  const { user, authStatus, route } = useAuthenticator((context) => [context.user, context.authStatus]);

  const [videoId, setVideoId] = useState("");
  const [resultVideoInfo, setResultVideoInfo] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [channel, setChannel] = useState("");

  const [chatList, setChatList] = useState<any[]>([]);
  const [channelId, setChannelId] = useState("");
  const [channelUser, setChannelUser] = useState("");

  const [dispMode, setDispMode] = useState("");

  const [tabSelect, setTabSelect] = useState("1");

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
        setResultVideoInfo(JSON.stringify(response.data[0], null, "\t"));
        // チャット表示モード
        setDispMode("VIDEO");
      })
      .catch((error) => {
        // エラーハンドリング
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

  const handleChannelChange = (e: any) => {
    setChannel(e.target.value);
  };

  useEffect(() => {
    const src = "admin" + ":" + "#dCZ3jA*D/i$";
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
  }, []);

  // DynamoDBから検索
  const searchChat = useCallback(() => {
    const controller = new AbortController();

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const url = CHAT_SEARCH_URL + "?id=" + channelId;
    axiosInstance
      .get(url, {
        signal: controller.signal,
      })
      .then((response) => {
        // 配信毎にグルーピング
        const chatGropus: { [title: string]: any } = {};
        const chatDatas = response.data["items"] as any[];
        const videoDatas = response.data["video"] as any[];

        for (let i in chatDatas) {
          const d = chatDatas[i];
          const id = d.video_id;
          if (!Object.keys(chatGropus).includes(id)) {
            chatGropus[id] = [];
          }
          chatGropus[id].push(d);
        }

        // 文字列に起こす
        const commentLists = [];
        for (let id in chatGropus) {
          const items: any[] = chatGropus[id];
          items.sort((a: any, b: any) => (a.datetime < b.datetime ? -1 : 1));

          // 動画情報取得
          const video = videoDatas.filter((v) => v.id == id);
          if (video.length) {
            const v = video[0];
            // 動画情報があるなら
            const itemElm = [];
            const start = v["liveStreamingDetails"]["actualStartTime"];
            // v["startAt"];
            const startDt = new Date(start);

            for (let item in items) {
              const ts = items[item].datetime;
              const tsDt = new Date(ts);

              // タイムコードが開始前
              const isMuinus = tsDt.getTime() < startDt.getTime();

              const tsD2 = isMuinus ? startDt : tsDt; // マイナスの場合は逆にする
              const startDt2 = isMuinus ? tsDt : startDt; // マイナスの場合は逆にする

              // 開始時刻とチャット時刻の差分を求める
              const diff_fns = sub(tsD2, {
                years: startDt2.getFullYear(),
                months: startDt2.getMonth(),
                days: startDt2.getDay(),
                hours: startDt2.getHours(),
                minutes: startDt2.getMinutes(),
                seconds: startDt2.getSeconds(),
              });

              const str_sub_dt = format(diff_fns, "HH:mm:ss");

              const str = (isMuinus ? "-" : "") + str_sub_dt + " | " + items[item].message;
              const muinusMg = isMuinus ? 0 : 4;
              itemElm.push(
                <Typography key={item} variant="body1" sx={{ marginLeft: 32 + muinusMg + "px" }}>
                  {str}
                </Typography>
              );
            }

            commentLists.push(
              <Box sx={{ marginBottom: "16px" }}>
                {/* タイトル */}
                <Stack direction="row">
                  <Link href={"https://www.youtube.com/watch?v=" + v["id"]} target={"_blank"}>
                    <FaYoutube size={"30px"} />
                  </Link>
                  <Typography variant="h6">{v["snippet"]["title"]}</Typography>
                </Stack>
                {itemElm}
              </Box>
            );
          }
        }
        setChatList(commentLists);

        // チャット表示モード
        setDispMode("CHAT");
      })
      .catch((error) => {
        // エラーハンドリング
      });
  }, [channelId]);

  /****************************************************************************************
   * タブ変更のハンドリング
   ****************************************************************************************/
  const onChangeTab = (event: React.SyntheticEvent, newValue: string) => {
    setTabSelect(newValue);

    if (newValue == "1") {
      // メンバー別ソート
    } else if (newValue == "2") {
      // カテゴリー別ソート
      // categorySort();
    }
  };

  const channelInfo = Object.keys(channelParams)
    .filter((x) => channelParams[x].type == "member")
    .map((key, index) => {
      const c = channelParams[key];
      return (
        <Stack direction="row" justifyContent="start">
          <Typography key={key}>
            {c.name} - {c.uid}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setChannelId(c.uid);
              setChannelUser(c.name);
            }}
            sx={{ height: "20px" }}
          >
            セットする
          </Button>
        </Stack>
      );
    });

  const MenuItems = () => {
    const list = Object.keys(channelParams).map((key, index) => {
      const c = channelParams[key];
      return <MenuItem value={key}>{c.name}</MenuItem>;
    });
    return list;
  };

  if (authStatus === "configuring") {
    return <CircularProgress />; // ローディングコンポーネント
  }

  // 未ログインの場合はトップページに遷移
  if (authStatus !== "authenticated") {
    return <Navigate replace to="/" />;
  }

  return (
    <Box sx={{ margin: 2, paddingTop: "72px" }}>
      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "管理ページ" },
        ]}
      ></BreadcrumbsEx>

      {/* タブエリア */}
      {apiKey != "" && (
        <Box>
          <TabContext value={tabSelect}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <TabList onChange={onChangeTab} aria-label="チャンネルフィルター">
                <Tab label="スケジュール" value="1" />
                <Tab label="チャット" value="2" />
              </TabList>
            </Box>
            <TabPanelEx value="1">
              <Box>
                <Typography sx={{ backgroundColor: "#FF0042", textAlign: "center", color: "#FFF" }}>スケジューラ―動画管理</Typography>

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
                <Button variant="contained" onClick={deleteVideoInfo}>
                  論理削除
                </Button>
                <Button variant="contained" onClick={updateVideoInfo}>
                  強制アップデート/外部コラボ追加
                </Button>
              </Box>
            </TabPanelEx>
            <TabPanelEx value="2">
              <Box sx={{ marginLeft: "4px", marginBottom: "16px" }}>
                <Typography sx={{ backgroundColor: "#FF0042", textAlign: "center", color: "#FFF" }}>コメント検索</Typography>
                {channelInfo}

                <Stack sx={{ marginTop: "12px" }} direction="row" justifyContent="start" className="flex-wrap">
                  <InputLabel>チャンネルID</InputLabel>
                  <Input id="channel-id" value={channelId} onChange={(event) => setChannelId(event.target.value)} sx={{ marginLeft: "8px", width: "240px" }} />
                  <Typography sx={{ marginLeft: "12px" }}>{channelUser}</Typography>
                </Stack>

                <Button variant="contained" onClick={searchChat} sx={{ backgroundColor: "#FFE54C", color: "#000" }}>
                  チャット検索
                </Button>
              </Box>
            </TabPanelEx>
          </TabContext>
          {dispMode == "VIDEO" && <Typography sx={{ whiteSpace: "pre-wrap", backgroundColor: "#F0F0F0", marginTop: "10px" }}>{resultVideoInfo}</Typography>}
          {dispMode == "CHAT" && chatList}
        </Box>
      )}
    </Box>
  );
}

export default Admin;
function utcToZonedTime(utcDate: any, arg1: string) {
  throw new Error("Function not implemented.");
}
