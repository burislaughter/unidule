import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { useDragLayer } from "react-dnd";

type StyledDivProps = {
  top: number;
  left: number;
  x: number;
  y: number;
};

export const DragLayer: FC = () => {
  const { item, offsetDifference, isDragging } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    offsetDifference: monitor.getDifferenceFromInitialOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !offsetDifference || !item) {
    return null;
  }

  const left = item.posX;
  const top = item.posY;

  const x = offsetDifference.x;
  const y = offsetDifference.y;

  const CARD_HEIGHT = 50;
  const CARD_WIDTH = 400;

  console.log("top:" + top, "left:" + left);

  return (
    <Box
      sx={{
        position: "fixed",
        left: `${left + x}px`,
        top: `${top + y + 600}px`,
        willChange: "transform",
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        color: "white",
        backgroundColor: "#2bff00",
        zIndex: 1000,
      }}
    >
      <Box>
        <Typography>{item.title}</Typography>
      </Box>
    </Box>
  );
};
