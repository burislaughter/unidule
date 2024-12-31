import { Box, Button, CircularProgress, styled, Table, TableBody, TableCell, TableContainer, TableRow, Paper, TableHead, Link, Typography, IconButton } from "@mui/material";
import BreadcrumbsEx from "../breadcrumbs";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserAttributes, FetchUserAttributesOutput } from "aws-amplify/auth";
import { roleToName, URL_BASE } from "../const";
import axios, { AxiosRequestConfig } from "axios";
import { VoiceButtonOne } from "../special/VoiceButtonOne";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { CiEdit } from "react-icons/ci";
import { EditText, FixCallbackParamas } from "./EditText";
import { EditSelect } from "./EditSelect";

const VOICE_LIST_URL = URL_BASE + "voice";
const VOICE_TIMELINE_URL = URL_BASE + "voice_timeline";

function MyPage() {
  const { user, authStatus, route } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [attr, setAttrResult] = useState<FetchUserAttributesOutput>();

  const [nickname, setNickname] = useState<string | undefined>("");
  const [email, setEmail] = useState<string | undefined>("");
  const [role, setRole] = useState<string | undefined>("");
  const [allVoice, setAllVoice] = useState<any[] | undefined>([]);
  const [createdVoice, setCreatedVoice] = useState<any[] | undefined>([]);
  const [selectVoice, setSelectVoice] = useState<any | undefined>();
  const [reLoadCt, setReLoadCt] = useState(0);
  const [myVTUs, setMyVTUs] = useState<any[]>([]);

  // 変種確定後にDB更新
  const fixCallback = (item: FixCallbackParamas) => {
    console.log(item);

    const v = createdVoice?.filter((x) => x.uid == item.uid);

    if (v == undefined || v?.length == 0) return;

    if (item.field == "title") {
      v[0].title = item.value;
    }

    if (item.field == "category") {
      v[0].tag = item.value;
    }

    // サーバーへ送信
    const requestParam: AxiosRequestConfig = {
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*",
      },
      data: v[0],
    };

    axios
      .patch(VOICE_LIST_URL, requestParam)
      .then((response) => {
        console.log(response.data);
        setReLoadCt((_x) => _x + 1);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const deleteVoiceButtonRequest = (button_uid: string, user_id: string, item: any) => {
    const requestParam: AxiosRequestConfig = {
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        uid: button_uid,
        user_id: user_id,
      },
    };

    axios
      .delete(VOICE_LIST_URL, requestParam)
      .then((response) => {
        console.log(response.data);
        item.isDeleted = "true";
        setReLoadCt((_x) => _x + 1);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const deleteTimelineButtonRequest = (button_uid: string, user_id: string, item: any) => {
    const requestParam: AxiosRequestConfig = {
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        uid: button_uid,
        user_id: user_id,
      },
    };

    axios
      .delete(VOICE_TIMELINE_URL, requestParam)
      .then((response) => {
        console.log(response.data);
        item.isDeleted = true;
        setReLoadCt((_x) => _x + 1);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getCurrentUserAsync = async () => {
    const attr = await fetchUserAttributes();
    setAttrResult(attr);

    if (attr !== undefined) {
      // 表示名
      setNickname(attr["nickname"]);
      // メールアドレス
      setEmail(attr["email"]);
      // 権限
      setRole(attr["custom:role"]);
    }
  };

  useEffect(() => {
    if (user) {
      getCurrentUserAsync();
    }
  }, [user]);

  // 音声ボタンデータ
  useEffect(() => {
    if (user?.userId == undefined) return;

    const controller = new AbortController();

    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    axios
      .get(VOICE_LIST_URL, {
        params: {
          // user_id: user?.userId,
          is_force: true,
        },
        withCredentials: false,
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        // レスポンス処理
        // 全て
        setAllVoice(response.data);
        // 現ログインユーザーが作成したもの
        setCreatedVoice(response.data.filter((x: any) => x.user_id == user?.userId));
      })
      .catch((error) => {
        // エラーハンドリング
        console.log(error);
      });
    return () => {
      controller.abort();
    };
  }, [user]);

  useEffect(() => {
    if (user?.userId == undefined) return;

    const controller = new AbortController();
    axios
      .get(VOICE_TIMELINE_URL, {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          user_id: user?.userId,
          limit: 1000,
        },
        withCredentials: false,
      })
      .then((w) => {
        console.log("GetVTU List OK" + w.data.length);
        setMyVTUs(w.data);
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      controller.abort();
    };
  }, [user]);

  if (authStatus === "configuring") {
    return <CircularProgress />; // ローディングコンポーネント
  }

  // 未ログインの場合はトップページに遷移
  if (authStatus !== "authenticated") {
    return <Navigate replace to="/" />;
  }

  const headerData = ["ユーザーID", "表示名", "メールアドレス", "権限"];
  const userData = [user?.userId, nickname, email, roleToName(role!)];

  return (
    <Box sx={{ paddingTop: "72px", marginLeft: "8px" }}>
      <BreadcrumbsEx
        props={[
          { url: "/", label: "スケジューラー" },
          { url: "", label: "マイページ" },
        ]}
      ></BreadcrumbsEx>
      <Box sx={{ padding: "10px", margin: "10px", backgroundColor: "#F5F5F5" }}>
        <TableContainer component={Paper} sx={{ margin: "20px", width: "480px", backgroundColor: "#FFF" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ユーザー情報</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {userData?.map((value, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row" style={{ width: "30%" }}>
                    {headerData[index]}
                  </TableCell>
                  <TableCell>{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* 音声ボタン */}
      <Box sx={{ padding: "10px", margin: "10px", backgroundColor: "#F5F5F5" }}>
        <TableContainer component={Paper} sx={{ margin: "20px", width: "95%", backgroundColor: "#FFF" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "240px" }}>タイトル</TableCell>
                <TableCell style={{ width: "140px" }}>カテゴリー</TableCell>
                <TableCell>Youtube</TableCell>
                <TableCell>音声ボタン</TableCell>
                <TableCell sx={{ width: "108px" }}>削除ボタン</TableCell>
                <TableCell sx={{ width: "108px" }}>削除フラグ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {createdVoice?.map((value, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    <EditText uid={value.uid} field={"title"} initValue={value.title} fixCallback={fixCallback} />
                  </TableCell>
                  <TableCell>
                    <EditSelect uid={value.uid} field={"category"} initValue={value.tag} fixCallback={fixCallback} />
                  </TableCell>
                  <TableCell>
                    <Link target="_brank" href={value.url}>
                      <YouTubeIcon sx={{ fontSize: "30px", height: "24px", margin: 0 }} />
                    </Link>
                  </TableCell>

                  {/* ヴォイスボタン */}
                  <TableCell>
                    <VoiceButtonOne
                      filename={value.filename}
                      title={value.title}
                      channel={value.channel}
                      isDenoise={value.isDenoise}
                      uid={value.uid}
                      reLoadFunc={setReLoadCt}
                      isAdmin={false}
                      selectVoice={setSelectVoice}
                      archiveUrl={value.url}
                      start={value.start}
                      end={value.end}
                      // setYtPalyerShotState={setYtPalyerShotState}
                      tag={value.tag}
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#C40000" }}
                      onClick={() => {
                        deleteVoiceButtonRequest(value.uid, user?.userId, value);
                      }}
                    >
                      削除
                    </Button>
                  </TableCell>
                  <TableCell>{value.isDeleted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* タイムライン */}
      <Box sx={{ padding: "10px", margin: "10px", backgroundColor: "#F5F5F5" }}>
        <TableContainer component={Paper} sx={{ margin: "20px", width: "95%", backgroundColor: "#FFF" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell style={{ width: "240px" }}>タイトル</TableCell>
                <TableCell>タイムライン</TableCell>
                <TableCell sx={{ width: "108px" }}>削除ボタン</TableCell>
                <TableCell sx={{ width: "108px" }}>削除フラグ</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {myVTUs?.map((value, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row">
                    <Link target="_brank" href={"https://unidule.jp/sp/voice_button?vtu=" + value.uid}>
                      <Typography>{value.title ?? "No Title"}</Typography>
                    </Link>
                  </TableCell>

                  {/* ヴォイスボタン */}
                  <TableCell>
                    {allVoice?.length == 0 && <></>}

                    {allVoice?.length != 0 &&
                      value.data.map((x: any) => {
                        const vo = allVoice?.filter((v) => v.uid == x.uid);
                        if (vo == undefined || vo.length == 0) {
                          return <></>;
                        } else {
                          return (
                            <VoiceButtonOne
                              key={value.uid + "-" + x.timelineUid}
                              filename={vo[0].filename}
                              title={vo[0].title}
                              channel={vo[0].channel}
                              isDenoise={vo[0].isDenoise}
                              uid={vo[0].uid}
                              reLoadFunc={setReLoadCt}
                              isAdmin={false}
                              selectVoice={setSelectVoice}
                              archiveUrl={vo[0].url}
                              start={vo[0].start}
                              end={vo[0].end}
                              // setYtPalyerShotState={setYtPalyerShotState}
                              tag={vo[0].tag}
                            />
                          );
                        }
                      })}
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="contained"
                      sx={{ backgroundColor: "#C40000" }}
                      onClick={() => {
                        deleteTimelineButtonRequest(value.uid, user?.userId, value);
                      }}
                    >
                      削除
                    </Button>
                  </TableCell>
                  <TableCell>{value.isDeleted == true ? "True" : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* <Typography>{reLoadCt}</Typography> */}
    </Box>
  );
}

export default MyPage;
