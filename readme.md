# canvas 与 可视化

HTML5提供了一个强大的元素```<canvas>```,canvas元素仅仅是为了充当绘图环境对象的容器而存在的，该环境对象```const context = document.getElementById(canvas).getContext('2d');```提供了全部的绘制功能。

## 简单图形的绘制

### 线段的绘制

线段是最简单、最基础的图形，在canvas中需要给定两点的坐标

```js
const ctx = document.getElementById(canvas).getContext("2d");
ctx.moveTo(0, 0);
ctx.lineTo(50, 50);
```