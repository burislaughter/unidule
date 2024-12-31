import { Box, Button, Typography } from "@mui/material";
import { useDrag } from "react-dnd";

function ViewTest() {
  const items = {
    id: "text",
  };
  const [{ opacity }, dragRef] = useDrag(
    () => ({
      type: "button",
      item: { items },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    []
  );

  return (
    <Box>
      <Typography>ViewTest</Typography>

      <Box sx={{ width: "200px", height: "200px", backgroundColor: "#FCC" }}>
        <Typography>DragArea</Typography>
        <Button variant="contained" ref={dragRef} disableRipple>
          Button
        </Button>
      </Box>

      <Box sx={{ width: "200px", height: "200px", backgroundColor: "#CFC" }}>
        <Typography>DropArea</Typography>
      </Box>
    </Box>
  );
}

export default ViewTest;
