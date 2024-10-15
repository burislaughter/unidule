import { Avatar, Box, Button, Typography } from "@mui/material";

type channelIconProps = {
  channel: string;
  cb: any;
  imgUrl: string;
  fullName: string;
  isSelected: boolean;
};

export function ChannelIconComp(props: channelIconProps) {
  const { channel, cb, imgUrl, fullName, isSelected } = props;
  const isFillter = isSelected ? "auto" : "sepia(1)";
  return (
    <Button
      variant="text"
      color="info"
      onClick={() => {
        cb(channel);
      }}
      sx={{ margin: 0, padding: 0, minWidth: "auto" }}
    >
      <Box sx={{ width: "52px" }}>
        <Box sx={{ justifyContent: " space-evenly", display: "flex", marginRight: "3px" }}>
          <Avatar
            src={imgUrl}
            sx={{
              width: 44,
              height: 44,
              filter: isFillter,
            }}
          />
        </Box>

        <Box py={0} sx={{ textAlign: "center" }}>
          <Typography variant="caption" my={0} sx={{ wordBreak: "keep-all", lineHeight: 0, color: isSelected ? "#000" : "#ccc" }}>
            {fullName}
          </Typography>
        </Box>
      </Box>
    </Button>
  );
}
