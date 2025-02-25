import { BackHand } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

function ViewReadMe() {
  return (
    <Box margin={"10px"} position="relative">
      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px" }}>上部メニュー</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={1}>
              <StyledTableCell component="th" scope="row" sx={{ display: "flex", width: "50%" }}>
                <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                  <img src="/manual/1.png" width={"600px"}></img>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%" }}>
                <Typography>①スケジューラ―に戻るリンク</Typography>
                <Typography>②フィルターアイコン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>選択したゆにメンの表示に絞ります</Typography>
                  <Typography>複数選択可能です</Typography>
                </Box>
                <Typography>③フィルターリセットボタン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>ゆにメンの絞り込みの設定をリセットします</Typography>
                </Box>

                <Typography>④音量調節スライダー</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>音量を調節します</Typography>
                  <Typography>スライダーを離したときに音量が確定します</Typography>
                </Box>

                <Typography>⑤マイボタンのみスイッチ</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>ログインしている時に、自分で作成したボタンのみを表示するようにします</Typography>
                </Box>

                <Typography>⑥検索ウィンドウ</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>入力したテキストを含む名前のボタンを選択候補に出して、そこから選択します</Typography>
                  <Box sx={{ maxWidth: "400px" }}>
                    <img src="/manual/2.png" width="100%"></img>
                  </Box>

                  <Typography marginTop={"20px"}>「感謝」に該当する候補のなかからいくつか選んだ状態</Typography>
                  <Box sx={{ maxWidth: "400px" }}>
                    <img src="/manual/3.png" width="100%"></img>
                  </Box>
                </Box>

                <Typography>⑦機能切り替えタブ</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>MEMBER: メンバー毎に並べ替え</Typography>
                  <Typography>CATEGORY: 挨拶、お礼等のカテゴリー毎の並べ替え</Typography>
                  <Typography>TIMELINE: 音声ボタンを独自のグループにして名前を付けて保存、共有する機能</Typography>
                </Box>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>MEMBERタブ</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={2}>
              <StyledTableCell component="th" scope="row" width="50%">
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                    <img src="/manual/4.png"></img>
                    <img src="/manual/4-2.png" width={"480px"}></img>
                  </Box>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%", display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography>①クリックで音声の再生</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>長押しでYoutube外部プレイヤーでアーカイブの音声の位置を再生します</Typography>
                </Box>
                <Typography>②再生中に出てくるアイコン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>メンバー毎に関連するアイコンが出てきます</Typography>
                </Box>
                <Typography>③停止ボタン</Typography>

                <Typography>④再・再生ボタン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>もう一度音声の再生位置を戻します</Typography>
                  <Typography>再生位置が最初からになってしまう場合も押してください</Typography>
                  <Typography>※再生位置は数秒ズレる事があります</Typography>
                </Box>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>音声追加機能</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={2}>
              <StyledTableCell component="th" scope="row" width="50%">
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                    <img src="/manual/6.png"></img>
                  </Box>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%", display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography>①話者選択</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>音声を発している人を選択します</Typography>
                </Box>
                <Typography>②アーカイブのURL</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>ゆにれいど関係のURLのみ登録できます</Typography>
                  <Typography>または外部コラボとしてスケジュールに載った場合は登録できます</Typography>
                  <Typography>それ以外の配信の音声を登録したい場合はサポートにご連絡してください</Typography>
                </Box>

                <Typography>③音声の時間の範囲</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>時:分:秒、分:秒、秒のみのフォーマットで指定できます</Typography>
                </Box>

                <Typography>④タイトル</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>ボタンの名前を設定します</Typography>
                </Box>

                <Typography>⑤カテゴリー</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>音声のカテゴリーを設定します</Typography>
                  <Typography>ここで設定したカテゴリーはCATEGORYタブでの分類に使用されます</Typography>
                </Box>

                <Typography>⑥申し送り事項</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>音声について細かい指定がある場合は記入してください</Typography>
                  <Typography>例）「長すぎる場合は適度に分割してください」など</Typography>
                </Box>

                <Typography>⑦MP3ファイルの選択ボタン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>すでに編集済のMP3ファイルがある場合は添付できます</Typography>
                  <Typography>音MADや切り抜き動画を作成した過程でファイルがすでになる場合等を想定しています</Typography>
                  <Typography>この機能はログインしている状態で使用できます</Typography>
                </Box>

                <Typography>⑧音声データの取得</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>アーカイブから音声を直接取得します</Typography>
                  <Typography>音声の取得にはたまに5分くらいかかります</Typography>
                  <Typography>この機能はログインしている状態で使用できます</Typography>
                </Box>

                <Typography>⑨削除キー</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>削除する場合に照合されるキーワードを設定します</Typography>
                  <Typography>設定は任意です</Typography>
                  <Typography>ログイン中の場合は、削除キーがなくてもマイページで一覧から選択して削除できます</Typography>
                  <Typography>ログインしてない、かつ削除キーを設定してなかった物を削除したい場合は、サポートに問い合わせしてください</Typography>
                </Box>

                <Typography>⑩リクエストボタン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>記入した内容で音声の追加をリクエストします</Typography>
                  <Typography>音声データが無い場合はグレー表示でボタンが追加された後、数日後に音声データが追加されます</Typography>
                  <Typography>音声データがありの場合、ボタンが押せる状態で仮登録されます。数日後にノイズ除去されます</Typography>
                </Box>

                <Typography>⑪音声削除タブ切り替え</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>音声削除モードに切り替えます</Typography>
                </Box>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>音声削除機能</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={2}>
              <StyledTableCell component="th" scope="row" width="50%">
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                    <img src="/manual/7.png"></img>
                  </Box>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%", display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography>①削除モード切り替え</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>削除モードをオンにします</Typography>
                  <Typography>オンにすると画像下のようにボタンに「✖」ボタンが付きます。</Typography>
                  <Typography>押すと削除を実行します</Typography>
                </Box>
                <Typography>②削除キー</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>ボタンを追加した時の削除キーを設定します</Typography>
                  <Typography>削除キーが合わないと削除できません</Typography>
                  <Typography>削除キーを忘れた場合はサポートに連絡してください</Typography>
                </Box>
                <Typography>③ボタンに付いた(✖)ボタン</Typography>
                <Box sx={{ marginLeft: "20px" }}>
                  <Typography>押すと削除を実行します</Typography>
                  <Typography>削除キーが合わないと削除できません</Typography>
                </Box>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>CATEGORYタブ</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={2}>
              <StyledTableCell component="th" scope="row" width="50%">
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                    <img src="/manual/5.png" width="480px"></img>
                  </Box>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%", display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography>ボタンを押すと、押したボタンのカテゴリの位置までスクロールします</Typography>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>TIMELINEタブ</Typography>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableBody>
            <StyledTableRow key={2}>
              <StyledTableCell component="th" scope="row" width="50%">
                <Box sx={{ display: "flex" }}>
                  <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                    <img src="/manual/8.png" width="800px"></img>
                  </Box>
                </Box>
              </StyledTableCell>
              <StyledTableCell component="th" scope="row" sx={{ backgroundColor: "#eee", width: "100%", display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography>SHAREボタンを押すと、X等で共有するためのURLが発行されます</Typography>
                <Box sx={{ height: "auto", alignItems: "flex-start" }}>
                  <img src="/manual/10.png" width="400px"></img>
                </Box>
                <Typography>URLからアクセスすると、TIMELINEの内容を復元して再生できます</Typography>
                <Typography>共有はせずとも、単に保存機能としても利用できます</Typography>
              </StyledTableCell>
            </StyledTableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ backgroundColor: "#F6747D", color: "white", paddingLeft: "6px", marginTop: "40px" }}>タイムライオン操作</Typography>

      <Box sx={{}}>
        <Box sx={{ height: "auto", alignItems: "flex-start", width: "100%" }}>
          <img src="/manual/9.png" width="100%"></img>
        </Box>
      </Box>
    </Box>
  );
}

export default ViewReadMe;
