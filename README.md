native-fs
===

A unified file system for React Native or Expo.

Will auto select the native module which is available.

## Installation

```bash
npm install native-fs
```

## Usage

Use module like `react-native-fs`.

```js
import fs from 'native-fs';

fs.readFile('path/to/file.txt', 'utf8').then((data) => {
  console.log(data);
});
```

## Supported

- [x] `expo-file-system` (NOTE: `appendFile` and `write` are not supported)
- [x] `@dr.pogodin/react-native-fs`
- [x] `react-native-fs`

## License

MIT

---

<p align="center">
  <a href="https://bricks.tools">
    <img width="90px" src="https://avatars.githubusercontent.com/u/17320237?s=200&v=4">
  </a>
  <p align="center">
    Built and maintained by <a href="https://bricks.tools">BRICKS</a>.
  </p>
</p>
