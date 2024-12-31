import { Box, Typography, Button, CircularProgress, styled, Table, TableBody, TableCell, TableContainer, TableRow, Paper, TableHead, Link } from "@mui/material";
import { channelParams } from "./const";
import YouTubeIcon from "@mui/icons-material/YouTube";
import XIcon from "@mui/icons-material/X";
function LinkPage() {
  const linkData = [
    {
      name: "ゆにれいど！",
      url: "https://uniraid.jp/",
      x: "https://x.com/Uniraid_VTuber",
      description: "「ゆにれいど！」オフィシャルサイト",
    },
    {
      name: "ゆにこめ！",
      url: "https://unicome.jp",
      x: "https://x.com/Uniraid_VTuber",
      description: "ゆにれいど！ アーカイブコメント一覧・検索サイト「ゆにこめ！」",
    },
  ];

  const memberData = Object.keys(channelParams)
    .filter((x) => channelParams[x].type == "member")
    .map((x) => {
      return channelParams[x];
    });

  return (
    <Box>
      <Typography sx={{ margin: "10px", fontWeight: 600 }}>リンク集(仮設)</Typography>

      <Box sx={{ padding: "10px", margin: "10px", backgroundColor: "#F5F5F5", overflow: "auto" }}>
        <TableContainer component={Paper} sx={{ margin: "0px", width: "800px", backgroundColor: "#FFF" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>外部サイトリンク</TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {linkData?.map((value, index) => (
                <TableRow key={index}>
                  <TableCell component="th" scope="row" style={{ width: "160px" }}>
                    {value.name}
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ textAlign: "left", fontSize: "0.75rem", marginBottom: "4px" }}>
                      <Link href={value.url}>{value.url}</Link>
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ textAlign: "left", fontSize: "0.75rem", marginBottom: "4px" }}>{value.description}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default LinkPage;
