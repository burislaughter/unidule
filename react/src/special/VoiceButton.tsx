import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress } from "@mui/material";
import useSound from "use-sound";

import { URL_RES } from "../const";

export type VoiceButtonProps = {
  filename: string;
  title: string;
  channel: string;
};

export const VoiceButton = ({ filename, title, channel }: VoiceButtonProps) => {
  const url = URL_RES + channel + "/" + filename;
  const [play] = useSound(url);

  return (
    <Button variant="contained" onMouseUp={() => play()} sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}>
      {title}
    </Button>
  );
};
