---
layout: post
title: Unity 八股
date: 2026-10-02 11:20:00 +0800
last_modified_at: 2026-10-02 11:20:00 +0800
---

## 0. 考点

1. 生命周期完整顺序（含跨物体、Instantiate、禁用）
2. Update / FixedUpdate / LateUpdate / timeScale
3. 物理：Collider / Rigidbody / Trigger / 图层 / 穿透
4. UGUI：Canvas 模式、Raycast、合批、适配
5. 渲染：DrawCall、四种合批、Overdraw、URP
6. 资源：Resources / AB / Addressables、卸载
7. 协程机制与坑
8. Animator 参数与 Culling
9. 序列化、Prefab、ScriptableObject
10. GC、对象池、GetComponent
11. IL2CPP / Mono、PlayerPrefs
12. 坐标转换

---

## 1. 生命周期（必背表）

### 1.1 常用回调顺序

同一脚本、物体已激活、场景加载时：

```
Awake → OnEnable → Start → [循环:
  FixedUpdate（0～多次）
  Update
  LateUpdate
] → OnDisable → OnDestroy
```

| 方法 | 何时 | 次数 | 典型用途 |
|------|------|------|----------|
| `Awake` | 对象创建后，**即使脚本逻辑要等，物体需是激活层级**；未激活物体上的脚本不 Awake，激活后才 Awake | 一次 | 保护缓存 `GetComponent` |
| `OnEnable` | 物体/脚本变为 enabled | 可多次 | **订阅事件** |
| `Start` | 第一次 Update 之前 | 一次 | 依赖别人已 Awake 的初始化 |
| `FixedUpdate` | 固定时间步（默认 0.02s） | 每物理帧 | 加力、刚体 |
| `Update` | 每渲染帧 | 每帧 | 输入、非物理移动 |
| `LateUpdate` | 所有 Update 之后、渲染前 | 每帧 | 相机跟随 |
| `OnDisable` | 禁用/销毁前 | 可多次 | **反订阅** |
| `OnDestroy` | 销毁 | 一次 | 最终清理 |
| `OnApplicationPause/Quit` | 切后台/退出 | — | 存档 |

补充：

- **所有物体的 Awake 都先于任何 Start**（同一帧加载的一批）
- `Instantiate`：当帧立刻 `Awake` + `OnEnable`；`Start` 在该物体第一次参与帧循环前（常是当帧稍后或下一帧，按版本/时机记「Awake 当帧、Start 不早于 Awake」）
- 物体 inactive 时 Instantiate：Awake/OnEnable **要等激活**
- 只关脚本 `enabled=false`：不调 Update，但物体仍在；会 OnDisable
- 销毁顺序：先 OnDisable 再 OnDestroy

**执行顺序**可在 Script Execution Order 里改；同脚本不同物体顺序 **不稳定**，不要依赖。

### 1.2 `Time.timeScale = 0`

| 项目 | timeScale=0 |
|------|-------------|
| `Update` / `LateUpdate` | **仍调用** |
| `Time.deltaTime` | **0** |
| `Time.unscaledDeltaTime` | 仍走真实时间 |
| `FixedUpdate` | **停止**（fixedDeltaTime 被缩放） |
| Animator（默认） | 停（可用 unscaled 更新） |
| 协程 `WaitForSeconds` | 受缩放；`WaitForSecondsRealtime` 不受 |
| `WaitForEndOfFrame` / `null` | 仍按帧走 |

暂停菜单 UI 动画用 `unscaledDeltaTime` 或 Animator Update Mode = Unscaled Time。

---

## 2. 物理

碰撞产生 **物理响应** 的条件：

1. 双方都有 Collider
2. 至少一方有 **非 Kinematic 的 Rigidbody**（双方都静态碰撞体不会物理碰撞）
3. 图层矩阵允许
4. 不是 Trigger（Trigger 只回调不挤开）

| | Collision | Trigger |
|---|-----------|---------|
| Is Trigger | false | true |
| 物理挤开 | 有 | 无 |
| 回调 | `OnCollisionEnter/Stay/Exit` | `OnTriggerEnter/Stay/Exit` |
| 需要 Rigidbody | 至少一方 | 至少一方（官方：一方 RB，或角色控制器等） |
| ContactPoint | 有 | 无 |

`OnCollision*` 参数 `Collision`；`OnTrigger*` 参数 `Collider`。  
2D 是 `OnCollisionEnter2D` 等，和 3D **不能混**。

Rigidbody：

| 体 | 受力 | 谁移它 |
|----|------|--------|
| Dynamic | 是 | 物理引擎 |
| Kinematic | 否 | `MovePosition` / 动画 |
| Static | 否 | 不要每帧动（成本高） |

移动 Dynamic 不要每帧改 `transform.position`（传送），用 `MovePosition`/`AddForce`。  
插值 Interpolation 抹平渲染与物理步差。

**高速穿透：** Discrete 漏检 → Continuous / Continuous Dynamic；或加厚、不要过小过快。

查询：`Raycast` / `OverlapSphere`；热路径用 `NonAlloc` + 复用数组。  
`NonAlloc` 本身不分配，**后面 `new List` 仍 GC**。

Layer vs Tag vs Sorting Layer：

- Layer：物理、渲染裁剪、射线过滤
- Tag：逻辑分类（Player）
- Sorting Layer / Order：2D/UI 绘制顺序

---

## 3. UGUI

### 3.1 Canvas Render Mode

| 模式 | 特点 |
|------|------|
| Screen Space - Overlay | 最前，不经相机，不受后处理 |
| Screen Space - Camera | 指定相机，可进后处理、有距离 |
| World Space | 世界里的 UI（血条） |

输入：`EventSystem` + `GraphicRaycaster`（UI）/ `PhysicsRaycaster`（3D）。  
命中看射线、深度、`Raycast Target`。关掉不用的 Raycast Target 减 Overdraw/检测。

`Image`：Sprite，Sliced/Filled；`RawImage`：Texture，单独图更好。  
`CanvasScaler`：Scale With Screen Size + 参考分辨率 + 锚点适配全面屏。

### 3.2 UI 合批（选择超高频）

同一 Canvas 下合批通常要同时满足：

1. **同一材质、同一纹理（同一图集）**
2. **中间不被不同材质/图集的 Graphic 打断**
3. **绘制顺序不交错穿插**
4. 字体图集 ≠ UI 图集 → Text 常和 Image **拆批**

另外：

- 每个 Canvas 独立重建；动态脏 Canvas 会重建网格
- **动静分离**：会变的进度条/血条单独 Canvas，避免整屏 UI 每帧 Rebuild
- 嵌套 Mask / 不同材质会打断
- `Canvas.ForceUpdateCanvases` 贵

`RectTransform`：锚点、轴心、`anchoredPosition`、`sizeDelta`。  
世界/屏幕/UI：

```csharp
Camera.main.WorldToScreenPoint(world);
RectTransformUtility.ScreenPointToLocalPointInRectangle(parent, screen, cam, out local);
// Overlay 的 cam 传 null
```

---

## 4. 渲染与合批

**Draw Call：** CPU 一次「请 GPU 画这批」。多了卡 CPU。  
**SetPass：** 切换着色器/渲染状态，往往更贵。

| 方式 | 做什么 | 限制 |
|------|--------|------|
| 静态合批 | 不动物体，Build 合并网格 | 占内存；运行时不要动；同材质 |
| 动态合批 | 运行时合并小网格 | 顶点少（约 300 量级）、同材质缩放等；URP 上常弱于 SRP |
| SRP Batcher（URP） | 减 Draw 之间的 SetPass | Shader 要合规范 CBUFFER；不是粒子万能 |
| GPU Instancing | 同 Mesh 同材质大量实例 | 要支持 Instancing |
| 图集合批 | 少贴图切换 | UI/2D 主力 |

Overdraw：半透明层层叠，手机杀手。UI 大透明图、粒子乱叠。  
透明物体一般不写深度、按距离从后往前，顺序错会花/闪。

URP vs Built-in：笔试知道 URP 是 SRP、体积光/后处理用 Renderer Feature 即可。  
Shader 两段：顶点变换位置；片元算颜色。  
Render Queue：背景 1000、几何 2000、透明 3000。

---

## 5. 资源：Resources / AB / Addressables

| | Resources | AssetBundle | Addressables |
|---|-----------|-------------|--------------|
| 用法 | `Resources.Load` | 自己管依赖/路径 | 按地址加载，管依赖和引用计数 |
| 包体 | 全打进包，难剔除 | 可远程 | 可远程、catalog 更新 |
| 卸载 | 难精确 | `Unload(true/false)` | `Release` |
| 现状 | 官方不推荐当主力 | 底层仍是它 | 新项目首选 |

AB 要点：

- 先加载依赖再加载主包
- `Unload(false)`：卸容器，已加载资源还在内存
- `Unload(true)`：连资源一起卸，已实例化物体可能丢贴图（粉红）
- 引用计数：多人用同一包，0 才能卸
- 重复 `Load` 同一包要自己缓存，否则报错/泄漏

Addressables：

- Group → 多个 bundle
- Local / Remote（CDN）
- **先更新 catalog，再按 hash 决定下不下新包**
- `Addressables.LoadAssetAsync` / `LoadSceneAsync`，用完 `Release` 或 `ReleaseInstance`
- 静态组 Cannot Change Post Release vs 可热更组

ScriptableObject：设计期配置，进包后当资产，运行时改不写回磁盘。  
存档用 JSON / 二进制，不要把运行时进度只写在 SO 上当持久化。

`DontDestroyOnLoad`：跨场景常驻；注意重复进场景会双单例，Awake 里杀自己。

场景：`LoadScene` 单场景替换；`LoadSceneAsync` Additive 叠加。记得卸旧场景。

---

## 6. 协程

**不是多线程。** 主线程每帧对 `IEnumerator` `MoveNext()`。

```csharp
IEnumerator C() {
    yield return null;                       // 下一帧
    yield return new WaitForSeconds(1f);     // 受 timeScale
    yield return new WaitForSecondsRealtime(1f);
    yield return new WaitForEndOfFrame();
    yield return new WaitForFixedUpdate();
    yield return StartCoroutine(Other());    // 嵌套等子协程
    yield return www;                        // 旧，现用 UnityWebRequest
}
```

坑：

- `StartCoroutine` **分配** 状态机对象（GC）
- 物体 SetActive(false) / Destroy：协程停；只 `enabled=false` 脚本，协程 **还在跑**（版本相关，稳妥自己 Stop）
- `StopCoroutine` 要用同一个 IEnumerator 或方法名字符串（字符串版不推荐）
- `WaitForSeconds` 每次 `new` 也分配；热路径缓存或不用协程
- 不能在真正的后台线程用大部分 Unity API

对比：`Invoke` 无循环；`async/await` 要 UniTask 等才好用；Update 计时最直。

---

## 7. 动画 Animator

| 参数 | 何时 |
|------|------|
| Trigger | 一次性：攻击、开门 |
| Bool | 持续：IsMoving |
| Float | Blend Tree：Speed |
| Int | 多分支：武器类型 |

- Has Exit Time：勾了要等到动画播到阈值才能切；连击/取消常关
- 代码 FSM 管规则，Animator 管表现，用参数桥
- 每帧 `SetBool` 相同值也有开销，缓存旧值
- Culling：`Always Animate` 屏外也算骨骼（怪多会卡）；屏外用 `Cull Update Transforms` / Completely
- Root Motion：位移由动画曲线走
- Animation Event：时间轴回调，逻辑与动作对齐

旧 `Animation` 组件 vs `Animator`：笔试选 Mecanim/Animator 为现代方案。

---

## 8. 序列化、Prefab、组件

Unity 能序列化：`public` 或 `[SerializeField]` 的字段；基本类型、`UnityEngine.Object` 引用、`[Serializable]` 的 class/struct、这些东西的 List/数组。

**不能很好序列化：** `Dictionary`（要包一层）、属性、抽象、接口（除了 Unity 对象）、多维数组。

`MonoBehaviour` 不要用构造函数碰引擎。  
Prefab：资源是模板，场景里是实例；改实例不改资源除非 Apply。  
变体 Prefab Variant 继承覆盖。

`GetComponent` 有成本，Awake 缓存。  
`Find` / `FindWithTag` / `FindObjectOfType` 全场景扫，热路径禁用。  
`transform.Find` 只找子层级，按名字脆。

`UnityEngine.Object` 重载了 `==`：已 Destroy 的对象与 C# 托管壳比较会像 null（**假 null**）。纯 C# 引用可能非 null 但 `== null` 为 true。

---

## 9. 性能与 GC（选择会包装成场景题）

会分配的：

- `new` class、装箱、字符串拼接、LINQ、`yield`、`StartCoroutine`、闭包、`GetComponents` 数组、部分 `foreach`

手段：对象池、预分配、`NonAlloc`、`sqrMagnitude` 代替 `Distance`、少 `Update` 改事件、合批、减 Overdraw、LOD、遮挡剔除、图集、对象池取出 **重置全部状态**。

对象池坑：只 `SetActive(false)` 不够。要重置血量、Trigger、Animator、Tween、协程、事件、标志位。

60 FPS 预算 ≈ **16.7 ms**。Profiler：CPU `GC.Alloc`、`Physics`、`Animator`、`Canvas.BuildBatch`、`Rendering`。

---

## 10. 平台与杂项

| 点 | 答案 |
|----|------|
| Mono vs IL2CPP | Mono 启动快、JIT；IL2CPP 快/合规/AOT，构建慢 |
| PlayerPrefs | 小键值，不适合存档大档，可能明文 |
| 小游戏/WebGL | 单线程、包体限制、少线程、注意透明混合 |
| Input | 旧 `Input.GetAxis`；新 Input System 动作图 |
| 物理步 | `Time.fixedDeltaTime`，和帧率解耦 |
| 层级 vs 排序 | Layer 物理/相机；Sorting 2D 画序 |
| `Destroy` vs `DestroyImmediate` | 运行时 Destroy 延迟到帧末；Immediate 编辑器 |

坐标：

- 世界 / 本地：`TransformPoint` / `InverseTransformPoint`
- 屏幕原点左下，UI 视 Canvas 而定

---

## 11. 易错选择

**Q1.** `Awake` 和 `Start` 谁保证「别人已经 Awake」？  
**A.** Start。Awake 只保证自己这物体创建后的初始化。

**Q2.** `timeScale=0` 时 Update 还走吗？`deltaTime`？FixedUpdate？  
**A.** Update 走，deltaTime=0，FixedUpdate 停。

**Q3.** 两个只有 Collider、都没有 Rigidbody 的物体会碰撞吗？  
**A.** 不会产生碰撞回调/物理响应。

**Q4.** Trigger 会把人挤开吗？  
**A.** 不会。

**Q5.** UI 合批：同 Canvas 下 Image 和 Text 一定合批吗？  
**A.** 不一定，字体图集不同常拆批。

**Q6.** 动态血条和静态背景应不应该同一个频繁脏的 Canvas？  
**A.** 不应，要动静分离。

**Q7.** 协程是多线程吗？  
**A.** 不是。

**Q8.** `WaitForSeconds` 受 timeScale 影响吗？Realtime 呢？  
**A.** 受；Realtime 不受。

**Q9.** `Resources.Load` 适合做热更分包吗？  
**A.** 不适合，用 AB/Addressables。

**Q10.** `Unload(true)` 后场景里用着的材质可能怎样？  
**A.** 丢资源，粉红/品红。

**Q11.** Addressables 更新资源先更什么？  
**A.** catalog。

**Q12.** 屏外大量怪 Animator 用 Always Animate 会怎样？  
**A.** 仍更新骨骼，浪费 CPU。

**Q13.** `Debug.Log(i)` 在 Update 里除了 IO 还可能怎样？  
**A.** 装箱/字符串分配，逼 GC。

**Q14.** 已 Destroy 的 MonoBehaviour，C# 里 `== null`？  
**A.** 常为 true（假 null）。

**Q15.** 静态合批的物体运行时移动？  
**A.** 不该动；动了失去静态合批意义/异常。

**Q16.** `FixedUpdate` 里读输入可能怎样？  
**A.** 漏输入或重复，输入放 Update，物理放 FixedUpdate，用标志衔接。

**Q17.** GPU Instancing 和动态合批都能上时，大量相同树选谁？  
**A.** Instancing。

**Q18.** ScriptableObject 改运行时字段，重启游戏还在吗？  
**A.** 编辑器下可能脏到资产；真机包内一般当只读，不要当存档。

---
