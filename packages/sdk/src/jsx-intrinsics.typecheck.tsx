/** @jsxImportSource @deckory/sdk */

import { Text } from "./primitives";

const frame = { x: 0, y: 0, width: 100, height: 40 } as const;

export const validSceneElement = <Text id="valid" frame={frame}>Valid</Text>;

// @ts-expect-error Scene JSX intentionally exposes no intrinsic HTML tags.
export const deniedIntrinsicElement = <div>Denied</div>;
