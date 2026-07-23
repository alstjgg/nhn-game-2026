import { describe, expect, it } from 'vitest'

import {
  mapSpriteRegionToSource,
  type DoodleSprite,
  type NormalizedRegion,
} from './sprite.ts'

describe('mapSpriteRegionToSource', () => {
  it('maps the cropped ink rectangle back to its source-canvas bounds', () => {
    const sprite = spriteFixture()
    const contentRegion: NormalizedRegion = {
      x: sprite.padding / sprite.width,
      y: sprite.padding / sprite.height,
      width: sprite.sourceBounds.width / sprite.width,
      height: sprite.sourceBounds.height / sprite.height,
    }

    expect(mapSpriteRegionToSource(contentRegion, sprite)).toEqual({
      x: 100,
      y: 50,
      width: 100,
      height: 60,
    })
  })

  it('accounts for transparent sprite padding around the source crop', () => {
    expect(mapSpriteRegionToSource(
      { x: 0, y: 0, width: 1, height: 1 },
      spriteFixture(),
    )).toEqual({
      x: 90,
      y: 40,
      width: 120,
      height: 80,
    })
  })

  it('clamps oversized normalized regions and padded bounds to the source canvas', () => {
    const edgeSprite: DoodleSprite = {
      dataUrl: 'data:image/png;base64,fixture',
      width: 40,
      height: 40,
      aspectRatio: 1,
      sourceWidth: 200,
      sourceHeight: 100,
      sourceBounds: {
        x: 180,
        y: 80,
        width: 20,
        height: 20,
      },
      padding: 10,
    }

    expect(mapSpriteRegionToSource(
      { x: -0.5, y: -0.25, width: 2, height: 1.5 },
      edgeSprite,
    )).toEqual({
      x: 170,
      y: 70,
      width: 30,
      height: 30,
    })
  })
})

function spriteFixture(): DoodleSprite {
  return {
    dataUrl: 'data:image/png;base64,fixture',
    width: 120,
    height: 80,
    aspectRatio: 1.5,
    sourceWidth: 400,
    sourceHeight: 300,
    sourceBounds: {
      x: 100,
      y: 50,
      width: 100,
      height: 60,
    },
    padding: 10,
  }
}
