import { Avatar, Box, Button, Typography } from "@mui/material";
import { getFullName } from "./App";

// フルネームの取得

function ChannelIconObj(channelInfo: any, i: number, cb: any) {
  return (
    <Button
      variant="text"
      color="info"
      onClick={() => {
        cb(channelInfo.channel);
      }}
      sx={{ margin: 0, padding: 0, minWidth: "auto" }}
    >
      <Box key={i}>
        <Box sx={{ justifyContent: " space-evenly", display: "flex", marginRight: "3px" }}>
          <Avatar
            alt={channelInfo.snippet.title}
            src={channelInfo.snippet.thumbnails.default.url}
            sx={{
              width: 44,
              height: 44,
            }}
          />
        </Box>

        <Box py={0} sx={{ textAlign: "center" }}>
          <Typography variant="caption" my={0} sx={{ wordBreak: "keep-all", lineHeight: 0, color: "#000" }}>
            {getFullName(channelInfo.channel)}
          </Typography>
        </Box>
      </Box>
    </Button>
  );
}
export default ChannelIconObj;
