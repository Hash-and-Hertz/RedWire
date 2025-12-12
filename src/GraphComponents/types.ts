// This represents a bunch of types used in the graph, this will most likely be expanded to multiple fiels later as it grows. 




/**
 * Represents a single node displayed on the dotted graph.
 *
 * NOTE:
 * - `x` and `y` are WORLD coordinates (not screen coordinates)
 * - `color` is any valid CSS color string (#hex, rgb(), hsl(), named)
 * - `name` is the label or identifier shown or stored for the node
 */
export interface NodeData {
  /** World-space X position of the node */
  x: number;

  /** World-space Y position of the node */
  y: number;

  /** Visual color of the node (CSS color value) */
  color: string;

  /** Display name / label for the node */
  name: string;
}

/**
 * Props passed into the DottedGraph component.
 *
 * This has been redesigned for Plan A:
 * - The parent owns all node state
 * - DottedGraph is just a visual interactive component
 */
export interface DottedGraphProps {
  /** List of nodes to render, in world coordinates */
  nodes: NodeData[];

  /**
   * Optional callback:
   * Fired when user adds a new node via clicking
   * Parent chooses how (or whether) to store it
   */
  onAddNode?: (node: NodeData) => void;

  /**
   * Optional callback:
   * Fired when zoom or pan changes.
   * Parent may choose to store scale/offset or ignore it.
   */
  onChangeTransform?: (transform: {
    scale: number;
    offset: { x: number; y: number };
  }) => void;

  /**
   * Current zoom level.
   * If omitted, the DottedGraph may manage zoom internally.
   */
  scale?: number;

  /**
   * Current pan offset.
   * If omitted, the DottedGraph may manage pan internally.
   */
  offset?: {
    x: number;
    y: number;
  };
}
