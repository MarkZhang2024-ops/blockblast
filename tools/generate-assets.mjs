import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function uuidFor(key) {
  const hex = crypto.createHash('md5').update(`blockblastpuzzle:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function compressScriptId(uuid) {
  const hex = uuid.replace(/-/g, '');
  const head = hex.slice(0, 5);
  let body = '';
  for (let index = 5; index < hex.length; index += 3) {
    const a = parseInt(hex[index], 16);
    const b = parseInt(hex[index + 1], 16);
    const c = parseInt(hex[index + 2], 16);
    body += BASE64_KEYS[(a << 2) | (b >> 2)];
    body += BASE64_KEYS[((b & 3) << 4) | c];
  }
  return head + body;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function vec3(x = 0, y = 0, z = 0) {
  return { __type__: 'cc.Vec3', x, y, z };
}

function quat() {
  return { __type__: 'cc.Quat', x: 0, y: 0, z: 0, w: 1 };
}

function color(r, g, b, a = 255) {
  return { __type__: 'cc.Color', r, g, b, a };
}

function baseNode(name, parentId, childIds, componentIds, id, position = vec3(), layer = 33554432) {
  return {
    __type__: 'cc.Node',
    _name: name,
    _objFlags: 0,
    __editorExtras__: {},
    _parent: parentId === null ? null : { __id__: parentId },
    _children: childIds.map((child) => ({ __id__: child })),
    _active: true,
    _components: componentIds.map((component) => ({ __id__: component })),
    _prefab: null,
    _lpos: position,
    _lrot: quat(),
    _lscale: vec3(1, 1, 1),
    _mobility: 0,
    _layer: layer,
    _euler: vec3(),
    _id: id,
  };
}

function uiTransform(nodeId, width, height, id) {
  return {
    __type__: 'cc.UITransform',
    _name: '',
    _objFlags: 0,
    __editorExtras__: {},
    node: { __id__: nodeId },
    _enabled: true,
    __prefab: null,
    _contentSize: { __type__: 'cc.Size', width, height },
    _anchorPoint: { __type__: 'cc.Vec2', x: 0.5, y: 0.5 },
    _id: id,
  };
}

function sceneGlobals() {
  return [
    {
      __type__: 'cc.SceneGlobals',
      ambient: { __id__: 11 },
      shadows: { __id__: 12 },
      _skybox: { __id__: 13 },
      fog: { __id__: 14 },
      octree: { __id__: 15 },
      skin: { __id__: 16 },
    },
    {
      __type__: 'cc.AmbientInfo',
      _skyColorHDR: { __type__: 'cc.Vec4', x: 0.08, y: 0.1, z: 0.2, w: 0.52 },
      _skyColor: { __type__: 'cc.Vec4', x: 0.08, y: 0.1, z: 0.2, w: 0.52 },
      _skyIllumHDR: 20000,
      _skyIllum: 20000,
      _groundAlbedoHDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
      _groundAlbedo: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
      _skyColorLDR: { __type__: 'cc.Vec4', x: 0.08, y: 0.1, z: 0.2, w: 0.52 },
      _skyIllumLDR: 0.8,
      _groundAlbedoLDR: { __type__: 'cc.Vec4', x: 0.2, y: 0.2, z: 0.2, w: 1 },
    },
    {
      __type__: 'cc.ShadowsInfo',
      _type: 0,
      _enabled: false,
      _normal: vec3(0, 1, 0),
      _distance: 0,
      _shadowColor: color(76, 76, 76, 255),
      _maxReceived: 4,
      _size: { __type__: 'cc.Vec2', x: 512, y: 512 },
    },
    {
      __type__: 'cc.SkyboxInfo',
      _envmapHDR: null,
      _envmap: null,
      _envmapLDR: null,
      _diffuseMapHDR: null,
      _diffuseMapLDR: null,
      _enabled: false,
      _useHDR: true,
      _envLightingType: 0,
    },
    {
      __type__: 'cc.FogInfo',
      _type: 0,
      _fogColor: color(200, 220, 245, 255),
      _enabled: false,
      _fogDensity: 0.3,
      _fogStart: 0.5,
      _fogEnd: 300,
      _fogAtten: 5,
      _fogTop: 1.5,
      _fogRange: 1.2,
      _accurate: false,
    },
    {
      __type__: 'cc.OctreeInfo',
      _enabled: false,
      _minPos: vec3(-1024, -1024, -1024),
      _maxPos: vec3(1024, 1024, 1024),
      _depth: 8,
    },
    {
      __type__: 'cc.SkinInfo',
      _enabled: false,
      _scale: 5,
    },
  ];
}

function makeScene(scriptType) {
  const sceneId = uuidFor('assets/scenes/Game.scene');
  return [
    {
      __type__: 'cc.SceneAsset',
      _name: 'Game',
      _objFlags: 0,
      __editorExtras__: {},
      _native: '',
      scene: { __id__: 1 },
    },
    {
      __type__: 'cc.Scene',
      _name: 'Game',
      _objFlags: 0,
      __editorExtras__: {},
      _parent: null,
      _children: [{ __id__: 2 }],
      _active: true,
      _components: [],
      _prefab: { __id__: 9 },
      _lpos: vec3(),
      _lrot: quat(),
      _lscale: vec3(1, 1, 1),
      _mobility: 0,
      _layer: 1073741824,
      _euler: vec3(),
      autoReleaseAssets: false,
      _globals: { __id__: 10 },
      _id: sceneId,
    },
    baseNode('Canvas', 1, [3], [5, 6, 7, 8], 'game-canvas', vec3(360, 640, 0)),
    baseNode('Camera', 2, [], [4], 'game-camera', vec3(0, 0, 1000)),
    {
      __type__: 'cc.Camera',
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: { __id__: 3 },
      _enabled: true,
      __prefab: null,
      _projection: 0,
      _priority: 1073741824,
      _fov: 45,
      _fovAxis: 0,
      _orthoHeight: 640,
      _near: 1,
      _far: 2000,
      _color: color(16, 20, 46, 255),
      _depth: 1,
      _stencil: 0,
      _clearFlags: 7,
      _rect: { __type__: 'cc.Rect', x: 0, y: 0, width: 1, height: 1 },
      _aperture: 19,
      _shutter: 7,
      _iso: 0,
      _screenScale: 1,
      _visibility: 1107296256,
      _targetTexture: null,
      _id: 'game-camera-comp',
    },
    uiTransform(2, 720, 1280, 'game-canvas-ui'),
    {
      __type__: 'cc.Canvas',
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _cameraComponent: { __id__: 4 },
      _alignCanvasWithScreen: true,
      _id: 'game-canvas-comp',
    },
    {
      __type__: 'cc.Widget',
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _alignFlags: 45,
      _target: null,
      _left: 0,
      _right: 0,
      _top: 0,
      _bottom: 0,
      _horizontalCenter: 0,
      _verticalCenter: 0,
      _isAbsLeft: true,
      _isAbsRight: true,
      _isAbsTop: true,
      _isAbsBottom: true,
      _isAbsHorizontalCenter: true,
      _isAbsVerticalCenter: true,
      _originalWidth: 720,
      _originalHeight: 1280,
      _alignMode: 2,
      _lockFlags: 0,
      _id: 'game-widget',
    },
    {
      __type__: scriptType,
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: { __id__: 2 },
      _enabled: true,
      __prefab: null,
      _id: 'game-app',
    },
    {
      __type__: 'cc.PrefabInfo',
      root: null,
      asset: null,
      fileId: sceneId,
      instance: null,
      targetOverrides: null,
      nestedPrefabInstanceRoots: null,
    },
    ...sceneGlobals(),
  ];
}

function makePrefab(name, width, height, scriptType) {
  const objects = [
    {
      __type__: 'cc.Prefab',
      _name: name,
      _objFlags: 0,
      __editorExtras__: {},
      _native: '',
      data: { __id__: 1 },
      optimizationPolicy: 0,
      persistent: false,
    },
    {
      ...baseNode(name, null, [], scriptType ? [2, 3] : [2], `${name}-root`),
      _prefab: { __id__: scriptType ? 4 : 3 },
    },
    uiTransform(1, width, height, `${name}-ui`),
  ];
  if (scriptType) {
    objects.push({
      __type__: scriptType,
      _name: '',
      _objFlags: 0,
      __editorExtras__: {},
      node: { __id__: 1 },
      _enabled: true,
      __prefab: null,
      _id: `${name}-script`,
    });
  }
  objects.push({
    __type__: 'cc.PrefabInfo',
    root: { __id__: 1 },
    asset: { __id__: 0 },
    fileId: uuidFor(`assets/prefabs/${name}.prefab`),
    instance: null,
    targetOverrides: null,
    nestedPrefabInstanceRoots: null,
  });
  return objects;
}

const gameScript = uuidFor('assets/scripts/ui/GameApp.ts');
const cellScript = uuidFor('assets/scripts/ui/CellView.ts');
const pieceScript = uuidFor('assets/scripts/ui/PieceView.ts');
const gameScene = uuidFor('assets/scenes/Game.scene');

writeJson(path.join(root, 'assets/scenes/Game.scene'), makeScene(compressScriptId(gameScript)));
writeJson(path.join(root, 'assets/prefabs/Cell.prefab'), makePrefab('Cell', 56, 56, compressScriptId(cellScript)));
writeJson(path.join(root, 'assets/prefabs/Piece.prefab'), makePrefab('Piece', 140, 140, compressScriptId(pieceScript)));
writeJson(path.join(root, 'assets/prefabs/TraySlot.prefab'), makePrefab('TraySlot', 192, 176, null));
writeJson(path.join(root, 'assets/prefabs/GameOverPanel.prefab'), makePrefab('GameOverPanel', 560, 460, null));

const note = [
  '音效和背景音乐由 AudioBus 实时合成，不依赖音频文件。',
  '音效开关和音乐开关会写入本地存档。',
  '',
].join('\n');
const noteFile = path.join(root, 'assets/resources/audio/README.txt');
fs.mkdirSync(path.dirname(noteFile), { recursive: true });
fs.writeFileSync(noteFile, note, 'utf8');

function metaFor(rel, full) {
  const uuid = uuidFor(rel.replace(/\\/g, '/'));
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const userData = rel.replace(/\\/g, '/') === 'assets/resources'
      ? { isBundle: true, bundleName: 'resources', priority: 8 }
      : { isBundle: false };
    return { ver: '1.2.0', importer: 'directory', imported: true, uuid, files: [], subMetas: {}, userData };
  }
  if (rel.endsWith('.ts')) {
    return { ver: '4.0.24', importer: 'typescript', imported: true, uuid, files: [], subMetas: {}, userData: {} };
  }
  if (rel.endsWith('.scene')) {
    return { ver: '1.1.50', importer: 'scene', imported: true, uuid, files: ['.json'], subMetas: {}, userData: {} };
  }
  if (rel.endsWith('.prefab')) {
    return { ver: '1.1.50', importer: 'prefab', imported: true, uuid, files: ['.json'], subMetas: {}, userData: {} };
  }
  return { ver: '1.0.1', importer: 'text', imported: true, uuid, files: ['.json'], subMetas: {}, userData: {} };
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.endsWith('.meta')) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    writeJson(`${full}.meta`, metaFor(rel, full));
    if (entry.isDirectory()) walk(full);
  }
}

walk(path.join(root, 'assets'));

writeJson(path.join(root, 'profiles/v2/packages/builder.json'), {
  __version__: '1.3.9',
  common: {
    name: 'BlockBlastPuzzle',
    platform: 'web-mobile',
    startScene: gameScene,
    scenes: [{ url: 'db://assets/scenes/Game.scene', uuid: gameScene }],
  },
});

console.log(JSON.stringify({
  gameScene,
  gameScript,
  gameScriptType: compressScriptId(gameScript),
  cellScript,
  pieceScript,
}, null, 2));
