import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  MouseEvent,
  WheelEvent,
} from "react";
import { NodeData, DottedGraphProps } from "./GraphComponents/types"; // So it can understand the different types used in the graph, modular add on. 

// THIS REALLY JUST REPRESENTS THE BACKGROUND GRAPH UI LOGIC,
// PARENT COMPONENT (DottedGraphProps) HANDLES THE ACTUAL DATA ON THE GRAPH



// Logic to graph: will be edited later to add more components on top of it, UNLESS we just pass everything through using props and coordinates. 
// to which it can easily add itself
const DottedGraph: React.FC<DottedGraphProps> = ({ nodes, onAddNode }) => {
  /** Reference to the canvas DOM node */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /** Zoom scale (1 = 100% zoom) */
  const [scale, setScale] = useState<number>(1);

  /** Pan offset in screen pixels */
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  /** Track whether user is currently panning */
  const isPanningRef = useRef<boolean>(false);

  /** Last mouse position used to calculate panning deltas */
  const lastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Convert WORLD → SCREEN coordinates
   */
  const worldToScreen = (x: number, y: number) => ({
    x: x * scale + offset.x,
    y: y * scale + offset.y,
  });

  /**
   * Convert SCREEN → WORLD coordinates
   */
  const screenToWorld = (sx: number, sy: number) => ({
    x: (sx - offset.x) / scale,
    y: (sy - offset.y) / scale,
  });

  /**
   * Main draw function. Re-renders:
   *  - Background
   *  - Dotted world grid
   *  - Nodes from props
   */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure canvas resolution matches CSS size
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    /** ---- BACKGROUND ---- */
    ctx.fillStyle = "#b3bdeaff";
    ctx.fillRect(0, 0, width, height);

    /** ---- DOTTED GRID ---- */
    const gridStep = 50; // world units between dots

    const worldLeft = -offset.x / scale;
    const worldRight = (width - offset.x) / scale;
    const worldTop = -offset.y / scale;
    const worldBottom = (height - offset.y) / scale;

    const startX = Math.floor(worldLeft / gridStep) * gridStep;
    const endX = Math.ceil(worldRight / gridStep) * gridStep;
    const startY = Math.floor(worldTop / gridStep) * gridStep;
    const endY = Math.ceil(worldBottom / gridStep) * gridStep;

    ctx.fillStyle = "#1f2937";

    for (let x = startX; x <= endX; x += gridStep) {
      for (let y = startY; y <= endY; y += gridStep) {
        const { x: sx, y: sy } = worldToScreen(x, y);
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

 
    /** ---- NODES ---- */
nodes.forEach((node: NodeData) => {
  const { x: sx, y: sy } = worldToScreen(node.x, node.y);

  // Node diameter matches grid cell in world space
  const nodeWorldSize = gridStep;
  const radius = (nodeWorldSize * scale) / 2;

  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = node.color;
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.font = "12px sans-serif";
  ctx.fillText(node.name, sx + radius + 4, sy + 4);
});

  }, [scale, offset, nodes]);

  /** Redraw when zoom, pan, or nodes change */
  useEffect(() => {
    draw();
  }, [draw]);

  /** Redraw on window resize */
  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  /**
   * Mouse down handler:
   *  - Left-click → create a red "attackbox" node at click position
   *  - Right-click or Shift+Left-click → start panning
   */
  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Right-click OR Shift-left → start panning
    if (e.button === 2 || e.shiftKey) {
      e.preventDefault();
      isPanningRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // TODO: Currently this is hardcoded to be attack boxes, but this cannot be the case in the future! We need to talk about functionality more! This should probably be something asked at the start.
    // Left-click → create node
    if (e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const worldPos = screenToWorld(sx, sy);

      const newNode: NodeData = {
        x: worldPos.x,
        y: worldPos.y,
        color: "red",
        name: "attackbox",
      };

      if (onAddNode) {
        onAddNode(newNode);
      }
    }
  };

  /**
   * Mouse move handler:
   *  - If panning, update the offset
   */
  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPanningRef.current) return;

    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;

    lastPosRef.current = { x: e.clientX, y: e.clientY };

    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  /** End panning */
  const endPan = () => {
    isPanningRef.current = false;
  };

  /**
   * Scroll wheel zoom
   */
  const handleWheel = (e: WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    const newScaleUnclamped = scale * zoomFactor;
    const newScale = Math.min(5, Math.max(0.4, newScaleUnclamped)); // clamp

    const worldBefore = screenToWorld(mouseX, mouseY);

    const newOffset = {
      x: mouseX - worldBefore.x * newScale,
      y: mouseY - worldBefore.y * newScale,
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#020617",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "crosshair",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()} // disable right-click menu
      />
    </div>
  );
};

export default DottedGraph;
