import { Box, Button, Typography } from "@mui/material";
import { FaArrowRotateLeft } from "react-icons/fa6";

type resetIconProps = {
  channel: string;
  cb: any;
  key: string;
};

export function ResetIconComp(props: resetIconProps) {
  const { channel, cb, key } = props;

  return (
    <Button
      variant="text"
      color="info"
      onClick={() => {
        cb(cb);
      }}
      sx={{ margin: 0, padding: 0, minWidth: "auto" }}
    >
      <Box key={key} sx={{ marginLeft: "10px", marginRight: "10px", marginTop: "16px" }}>
        <Box sx={{ justifyContent: "space-evenly", display: "flex" }}>
          <FaArrowRotateLeft />
        </Box>

        <Box py={0} sx={{ textAlign: "center" }}>
          <Typography variant="caption" my={0} sx={{ wordBreak: "keep-all", lineHeight: 0, color: "#000" }}>
            {channel}
          </Typography>
        </Box>
      </Box>
    </Button>
  );
}
