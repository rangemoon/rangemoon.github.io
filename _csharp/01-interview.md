---
layout: post
title: C# 八股
date: 2026-10-02 11:20:00 +0800
last_modified_at: 2026-10-02 11:20:00 +0800
---

## 0. 清单
1. CIL / CLR / JIT / AOT / IL2CPP
2. 值类型 vs 引用类型（含「struct 字段在 class 里在哪」）
3. 装箱 / 拆箱全部场景
4. string 不可变、驻留、`==` vs `Equals`
5. `const` / `readonly` / `static`
6. 参数：值 / `ref` / `out` / `in` / `params`
7. 重载 vs 重写 vs `new` 隐藏
8. 接口 vs 抽象类；访问修饰符
9. 委托 / 事件 / 多播 / 闭包分配
10. 泛型、约束、`default(T)`、协变逆变
11. 集合底层与复杂度
12. `IEnumerable` / `yield` / LINQ 延迟执行
13. GC 三代、LOH、`IDisposable` vs 析构
14. 异常、`finally`、`using`
15. `lock` / 线程基础（选择偶尔出）

---

## 1. 编译与运行时
### 1.1 CIL(Common Intermediate Language)
- C# 源码 → 编译成 **CIL（公共中间语言）** → 由 **CLR**（Unity 里是 Mono 或 IL2CPP）执行。

### 1.2 CLR(Common Language Runtime，公共语言运行时)
- 可由多种编程语言使用的"运行时"，核心功能包括：内存分配，程序集加载，安全性，异步处理和线程处理，可由面向CLR的所有语言使用。
- 主要目的是为了提供一个统一的、高效的、安全的运行时环境，使得不同的编程语言可以在同一个平台上无缝地协同工作

### 1.3 JIT(Just in Time)：
- 即时编译，运行时把 CIL 编成机器码（Mono 常见）

### 1.4 AOT/IL2CPP(Intermediate Language to cpp)：
- 预先把 CIL 转 C++ 再编本地码；iOS / 部分 Android / 小游戏常用

**Unity 笔试常问：**

- IL2CPP 不能用的：运行时代码生成、部分反射 emit、`System.Reflection.Emit`
- 泛型在 IL2CPP 上会膨胀，但值类型泛型仍避免装箱
- `MonoBehaviour` 不是普通 C# 对象：不能 `new`，由引擎创建，生命周期由引擎调

---

## 2. 类型系统

### 2.1 值类型 vs 引用类型

| | 值类型 | 引用类型 |
|---|--------|----------|
| 示例 | `int` `float` `bool` `char` `enum` `struct` `DateTime` | `class` `interface` `delegate` `string` `array` `object` |
| 基类 | `System.ValueType` → `object` | `System.Object` |
| 默认拷贝 | 复制一份数据 | 复制引用（指向同一对象） |
| 默认值 | `0` / `false` / 全零字段 | `null` |
| 可为 null | 需 `int?`（`Nullable<T>`） | 本来就可以 null |

**Unity 对照（必考）：**

- `Vector2/3/4`、`Quaternion`、`Color`、`Ray`、`Bounds` → **struct**
- `Transform`、`GameObject`、`MonoBehaviour`、`UnityEngine.Object` → **class**
- `string` 是引用类型，但不可变，看起来像值语义

### 2.2 栈 / 堆（选择最爱挖坑）

错误说法：「值类型一定在栈上，引用类型一定在堆上」。

正确说法：

- **局部变量里的值类型** → 一般在栈上
- **引用类型对象本体** → 堆上，栈上只有引用
- **class 的字段如果是 struct** → 这块 struct **跟对象一起在堆上**
- **数组** 是引用类型；`int[]` 的元素连续躺在堆上
- 被闭包捕获的局部变量 → 会被提升成堆上的显示类字段

```csharp
class Player {
    public Vector3 pos; // struct，但住在堆上的 Player 对象里
}
void Foo() {
    Vector3 p = Vector3.zero; // 局部，栈上
    Player a = new Player();  // a 在栈，Player 和 pos 在堆
}
```

### 2.3 `struct` vs `class` 选型

| 用 struct | 用 class |
|-----------|----------|
| 小、短命、不变或近似不变（≤16 字节经验值） | 有身份、要继承、体积大 |
| 不想 GC | 要多态、要 null、要共享同一份 |

坑：大 struct 当参数/返回值会整份复制；每帧 `transform.position` 是复制 Vector3，改副本不改 Transform。

```csharp
transform.position.x = 1; // 编译错误或无效：改的是副本
var p = transform.position; p.x = 1; transform.position = p; // 正确
```

### 2.4 装箱 / 拆箱

**装箱**：值类型 → `object` 或接口类型，**堆上 new 一个包装对象**，触发 GC。  
**拆箱**：从包装里拷回值类型，类型必须精确匹配。

```csharp
int n = 42;
object o = n;          // 装箱
int m = (int)o;        // 拆箱
long x = (long)o;      // 运行时 InvalidCastException（不能拆完再隐转）
long y = (int)o;       // 先拆 int 再隐转 long，可以
```

**必背装箱场景：**

1. 值类型赋给 `object` / 非泛型集合 `ArrayList`
2. 值类型赋给接口变量：`IComparable c = 3;`
3. `Debug.Log(123)`、字符串拼接 `"HP:" + hp`（部分会装箱）
4. `params object[]`、`String.Format("{0}", 1)`
5. 非泛型比较器、`Hashtable`

**不装箱：** `List<int>`、`Dictionary<int,int>`、泛型方法 `void F<T>(T x)`。

泛型好处（选择常出）：编译期定类型、避免值类型装箱、不用强转、一份代码多类型。

---

## 3. string、const、参数传递

### 3.1 string

- 引用类型 + **不可变**：任何「修改」都 new 新对象
- 字面量会 **驻留（intern）**：相同字面量可能指向同一实例
- `==` 对 string **重载为值比较**；`ReferenceEquals` 才比引用
- 循环拼接用 `StringBuilder`，先 `Capacity`

```csharp
string a = "ab";
string b = "a" + "b";          // 编译期折叠，常驻留，== 且可能引用相同
string c = string.Intern(new string(new[]{'a','b'}));
```

`StringBuilder` 是引用类型、可变；`ToString()` 才得到 string。

### 3.2 `const` vs `readonly` vs `static`

| | const | readonly | static |
|---|-------|----------|--------|
| 何时定值 | 编译期 | 声明或构造函数 | 属于类型 |
| 类型限制 | 仅常量：数字/字符串/null | 任意 | — |
| 改库后的坑 | 别的程序集可能仍用旧常量（内联） | 运行时读字段 | — |

`static readonly`：运行时初始化一次，适合跨程序集的「常量」。

`static` 构造函数：类型第一次用之前自动调一次，无参、不能手动调。

### 3.3 参数传递

| 修饰 | 调用前 | 方法内 | 作用 |
|------|--------|--------|------|
| 默认 | 必须有值 | 改形参不影响实参（引用类型改的是对象内容，重绑引用不影响外） | 传副本 |
| `ref` | **必须先赋值** | 可读可写实参 | 别名 |
| `out` | 可以未赋值 | **必须赋值** | 输出 |
| `in` | 必须有值 | 只读（防大 struct 复制） | C# 7.2 |
| `params` | 可传 0～n 个 | 方法内是数组 | 必须是最后一个参数 |

```csharp
void Swap(ref int a, ref int b) { int t = a; a = b; b = t; }
void Parse(string s, out int n) { n = int.Parse(s); }

void Rebind(List<int> list) { list = new List<int>(); }      // 外面不变
void Mutate(List<int> list) { list.Add(1); }                 // 外面变了
void RebindRef(ref List<int> list) { list = new List<int>(); } // 外面变了
```

---

## 4. OOP 与多态

### 4.1 重载 vs 重写 vs `new`

| | 重载 overload | 重写 override | 隐藏 new |
|---|---------------|---------------|----------|
| 关系 | 同类（或继承后仍算重载） | 父子，签名相同 | 父子，签名相同 |
| 关键字 | 参数列表不同 | 基 `virtual/abstract`，子 `override` | 子 `new` |
| 绑定 | **编译期**看引用的声明类型 | **运行时**看实际对象 | 看声明类型 |
| 也叫 | 编译时多态 | 运行时多态 | 不是多态 |

```csharp
class A { public virtual void F() => Console.Write("A"); }
class B : A {
    public override void F() => Console.Write("B");
    public new void G() => Console.Write("Bg");
}
A x = new B();
x.F(); // B
```

`sealed override`：禁止再往下重写。  
`sealed class`：不能被继承。

### 4.2 接口 vs 抽象类

| | 接口 interface | 抽象类 abstract |
|---|---------------|-----------------|
| 语义 | Can-Do 能力 | Is-A 是一种 |
| 继承 | 类可实现多个 | 只能单继承 |
| 字段 | 不能有实例字段（C# 8 前） | 可以 |
| 实现 | 默认无实现（C# 8 可默认实现） | 可以有已实现方法 |
| 构造 | 无 | 可以有 |
| 访问性 | 成员默认 public | 可 private/protected |

多个接口同名方法 → **显式接口实现**，调用时先转换类型。

### 4.3 访问修饰符

| 修饰符 | 本类 | 同程序集 | 子类 | 外部 |
|--------|------|----------|------|------|
| `private` | ✓ | | | |
| `internal` | ✓ | ✓ | | |
| `protected` | ✓ | | ✓ | |
| `protected internal` | ✓ | ✓ | ✓（同或跨程序集子类） | |
| `private protected` | ✓ | 同程序集子类 | | |
| `public` | ✓ | ✓ | ✓ | ✓ |

类默认 `internal`，成员默认 `private`。  
`static` 方法属于类型，不走实例构造。

### 4.4 不能被 `MonoBehaviour` 做的事

- 不要用构造函数初始化场景依赖；用 `Awake` / `Start`
- 不要在字段初始化器里调 `GetComponent`（对象可能还没就绪）
- 销毁用 `Destroy`，不要当普通 C# 那样指望析构立刻跑

---

## 5. 委托、事件、Lambda

| | 委托 Delegate | 事件 Event |
|---|---------------|------------|
| 本质 | 类型安全的方法引用（多播列表） | 对委托的封装 |
| 外部 `Invoke` | 可以 | **不可以**，只能 `+=` / `-=` |
| 典型用途 | 回调、把函数当参数 | 发布-订阅 |

```csharp
public Action<int> OnScore;           // 委托字段，谁都能 Invoke
public event Action<int> ScoreChanged; // 只有类内能 Invoke
```

要点：

- `Action` = 无返回，`Func<T>` = 有返回；多播时 **只保留最后一个返回值**
- `+=` 订阅，`-=` 取消；忘记取消 → 对象被委托抓住 → **内存泄漏**
- Lambda 捕获局部变量会生成闭包类（堆分配）；热路径不要每帧 `+= () =>`
- 空委托调用必须 `?.Invoke(...)`
- Unity `UnityEvent` 可在 Inspector 绑定，但比 C# event 慢、会有装箱

---

## 6. 泛型、集合、迭代

### 6.1 泛型

```csharp
void Swap<T>(ref T a, ref T b) { T t = a; a = b; b = t; }
class Box<T> where T : class, new() { } // 约束：引用类型且有无参构造
```

常见约束：`struct` / `class` / `new()` / 基类 / 接口 / `unmanaged`。

`default(T)`：值类型给 0，引用类型给 null。

**协变 / 逆变（选择进阶）：**

- `out T` 协变：`IEnumerable<string>` → `IEnumerable<object>`
- `in T` 逆变：`Action<object>` → `Action<string>`
- 只能用在接口/委托；`List<T>` **不变**，`List<string>` 不能当 `List<object>`

### 6.2 集合选型（复杂度必背）

| 类型 | 底层 | 查找 | 头尾增删 | 中间增删 | 用途 |
|------|------|------|----------|----------|------|
| `T[]` | 连续，长度固定 | O(1) | — | O(n) | 定长、极致性能 |
| `List<T>` | 动态数组 | O(1) 下标 | 尾 O(1) 均摊 | O(n) | **默认首选** |
| `LinkedList<T>` | 双向链表 | O(n) | O(1) | 已知节点 O(1) | 插队、取消订单 |
| `Stack<T>` | 数组栈 | — | O(1) | — | 撤销、括号 |
| `Queue<T>` | 循环数组 | — | O(1) | — | FIFO、BFS |
| `Dictionary<K,V>` | 哈希表 | O(1) 均摊 | — | — | 映射 |
| `HashSet<T>` | 哈希集合 | O(1) | — | — | 去重、存在 |
| `SortedDictionary` | 红黑树 | O(log n) | — | — | 有序键 |
| `Queue` vs `List` 当队列 | List 头删 O(n) | 用 Queue |

`List` 扩容一般 **2 倍**，扩容会复制，旧数组变 GC。预估大小就 `new List<T>(cap)`。

`Dictionary` 的 key 必须有稳定 `GetHashCode` / `Equals`；可变对象当 key 改字段会丢。

### 6.3 foreach、IEnumerable、yield

- `foreach` 走 `GetEnumerator()` + `MoveNext()` + `Current`
- 有的集合 `foreach` 会装箱（旧版值类型枚举器被当成接口）
- 热路径 Unity 里对 `List` 用 `for` 更稳
- `yield return` 让编译器生成状态机类（**堆分配**）
- `IEnumerable` 是「能遍历」；多次 `foreach` 可能 **重新执行**（LINQ 延迟）

```csharp
IEnumerable<int> Range(int n) {
    for (int i = 0; i < n; i++) yield return i;
}
```

### 6.4 LINQ（笔试 + Unity 性能都考）

- 多数标准查询是 **延迟执行**：定义时不算，枚举时才算
- `ToList()` / `ToArray()` / `Count()` / `Average()` 会立即执行
- 每次 `foreach` 可能重算一遍
- Unity 热路径（Update、怪 AI）**禁止 LINQ**：产生委托、迭代器、闭包、GC

---

## 7. GC、IDisposable、异常

### 7.1 分代回收

| 代 | 谁 | 回收频率 |
|----|----|----------|
| 0 | 短命临时对象 | 最频繁 |
| 1 | 0 代活下来的 | 缓冲 |
| 2 | 长命对象 | 最贵 |
| LOH | 大对象（通常 ≥85KB） | 跟 2 代一起，昂贵 |

Unity：**GC 会停主线程** → 掉帧。卡顿分两种：持续低帧（算太多）vs 周期性尖峰（GC）。

减少 GC：对象池、预分配、禁热路径 LINQ/字符串拼接/闭包、泛型避装箱、缓存 `GetComponent`、缓存委托。

### 7.2 Dispose vs 析构（Finalize）

| | `IDisposable.Dispose` | 析构函数 `~T()` |
|---|-----------|----------------|
| 何时 | 你主动 / `using` | GC 不确定时间 |
| 用途 | 立刻释放非托管/事件/句柄 | 兜底，尽量别靠它 |
| Unity | 取消事件、停协程、卸 AB | 不要在析构里碰引擎 API |

`using` = `try/finally { Dispose() }`。

### 7.3 异常

- `try` 后面必须有 `catch` 或 `finally`
- 多个 `catch` 从 **特化到一般**（先 `IOException` 再 `Exception`）
- `finally` 无论是否异常都执行（除非进程被干掉）
- `catch` 后 `throw;` 保留栈；`throw ex;` 重置栈（选择坑）
- 不要用异常做正常控制流

---

## 8. 相等性、可空、其它选择高频

```csharp
int a = 1, b = 1;
object x = a, y = b;
a == b;                 // true 值
x == y;                 // false：object 的 == 是引用，两个装箱对象
x.Equals(y);            // true
```

- `==` 可重载；`Equals` 可重写；进 Dictionary 必须 **同时重写 Equals + GetHashCode**
- `is` 判断类型，`as` 失败返回 null（只用于引用/可空），`(T)` 失败抛异常
- `int?` 是 `Nullable<int>`，**还是值类型**，但赋给 `object` 仍可能装箱
- 扩展方法：静态类静态方法，第一个参数 `this T`；只是语法糖
- 索引器：`this[int i]`
- `checked` 溢出抛异常，`unchecked` 静默截断；默认 unchecked

### 线程（偶尔出）

- `lock(obj)` = `Monitor.Enter/Exit`，obj 必须是 **引用类型**，不要 lock 值类型（会装箱成不同对象）
- 不要 `lock(this)` / `lock(typeof(T))` / `lock("str")`（驻留导致全局锁）
- `async/await` 不是多线程；`await` 让出，后续可能回主上下文（Unity 同步上下文）

---

## 9. 易错选择（先自己答再看）

**Q1.** `Vector3` 是值类型还是引用类型？改 `transform.position.x` 为什么不行？  
**A.** struct。`position` 返回副本。

**Q2.** `List<int>` 的 `Add` 会装箱吗？`ArrayList.Add(1)` 呢？  
**A.** 前者否，后者会。

**Q3.** 委托和事件最大差别？  
**A.** 事件外部不能 Invoke，只能 += / -=。

**Q4.** `string s = "a"; s += "b";` 之后原来的 `"a"` 怎样？  
**A.** 不可变，新对象 `"ab"`，旧字面量仍在驻留池。

**Q5.** 接口能多继承、抽象类不能，对吗？  
**A.** 类可实现多接口、只能继承一个类。接口之间可多继承。

**Q6.** `virtual` 方法里用 `new` 隐藏，基类引用调谁？  
**A.** 调基类版本（看声明类型）。

**Q7.** `out` 和 `ref` 谁必须在调用前赋值？  
**A.** `ref` 必须；`out` 方法内必须赋。

**Q8.** LINQ 的 `Where` 什么时候真正过滤？  
**A.** 枚举时（延迟），`ToList()` 时立即。

**Q9.** Unity 热路径为什么不用 `foreach` + LINQ？  
**A.** 可能分配枚举器/委托/闭包，逼 GC。

**Q10.** `IComparable c = 3;` 发生了什么？  
**A.** 装箱。

**Q11.** `static` 构造函数调用几次？  
**A.** 每个类型最多一次，CLR 保证。

**Q12.** `const int X = 1` 改成 2 并只重编译库，已编译的调用方一定看到 2 吗？  
**A.** 不一定，const 可能被内联进调用方。

**Q13.** `yield return` 的本质？  
**A.** 编译器生成状态机类，实现 `IEnumerator`。

**Q14.** `Dictionary` 用自定义 class 当 key，只重写 `Equals` 可以吗？  
**A.** 不行，必须同时重写 `GetHashCode`。

**Q15.** `lock(1)` 行吗？  
**A.** 不行，1 装箱每次可能不同对象，锁不住；且可能锁 intern 之外的临时盒。

---
