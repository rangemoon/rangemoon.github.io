---
layout: post
title: C++ 八股
date: 2026-10-02 11:20:00 +0800
last_modified_at: 2026-10-02 11:20:00 +0800
---

## 0. 考点清单

1. 编译链接过程、头文件、ODR
2. 指针 / 引用 / 数组 / 指针算术
3. `sizeof` / 字节对齐 / 空类大小
4. 栈堆、`new`/`delete` vs `malloc`/`free`
5. 虚函数、虚表、虚析构、纯虚
6. 继承布局、多继承、虚继承（钻石）
7. 构造 / 析构顺序、拷贝 / 移动、Rule of 3/5
8. `const` / `static` / `explicit` / `mutable`
9. 四种 cast
10. STL 底层、复杂度、**迭代器失效**
11. 智能指针 `unique` / `shared` / `weak`
12. 模板、重载决议
13. 左值右值、移动语义
14. 常见输出题（指针、虚调用、拷贝）

---

## 1. 编译与语言基础

源文件 `.cpp` → 预处理（宏、`#include`）→ 编译成 `.o/.obj` → 链接成可执行文件。

| 概念 | 要点 |
|------|------|
| 声明 vs 定义 | 声明可多次，定义只能一次（ODR） |
| `inline` | 建议内联，现代更多是「允许多定义」 |
| `extern` | 声明在别处定义 |
| 头文件 | 只放声明；实现放 cpp，防重复包含用 `#pragma once` |
| 宏 | 预处理文本替换，无类型，小心副作用 `#define SQ(x) ((x)*(x))` |

`sizeof` 是 **编译期** 运算符，不算 strlen，对数组名是整个数组，对指针是指针宽度（32 位 4，64 位 8）。

```cpp
char s[] = "ab";     // 含 '\0'，sizeof = 3
char* p = s;         sizeof(p) == 8; // 64 位
strlen(s) == 2;
int a[10];           sizeof(a) == 40;
int* q = a;          sizeof(q) == 8;
```

传参后数组退化成指针：`void f(int a[])` 里 `sizeof(a)` 是指针大小。

---

## 2. 指针、引用、数组

| | 指针 | 引用 |
|---|------|------|
| 可空 | 可以 `nullptr` | 必须绑定对象 |
| 可重绑 | 可以改指向 | 绑定后不能换 |
| 多级 | `int**` | 没有「引用的引用」变量（折叠是另一回事） |
| sizeof | 指针宽 | 等于被引对象 |

指针算术：`p+1` 跳 `sizeof(*p)` 字节。  
`&a[i]` 和 `a+i` 相同。`*p++` 先取再移。

悬空：返回局部变量地址、`delete` 后还用、迭代器失效。  
野指针：未初始化。  
内存泄漏：`new` 没 `delete`；循环 `shared_ptr`。

`const` 位置：

```cpp
const int* p;      // 不能通过 p 改值（指向常量）
int* const p;      // p 不能改指向（常量指针）
const int* const p;
```

---

## 3. sizeof、对齐、对象布局

对齐：成员按对齐数放，结构体 size 补到最大对齐的倍数。

```cpp
struct A { char c; int n; };     // 1 + 3 pad + 4 = 8
struct B { int n; char c; };     // 4 + 1 + 3 pad = 8
#pragma pack(1) 可取消填充（笔试会提，实际慎用）
```

空类 `sizeof` = **1**（要保证不同对象地址不同）。  
有虚函数：多一个 **vptr**（64 位通常 +8）。

```cpp
class C { virtual void f(); };   // 64 位常见 sizeof = 8
class D : public C { int x; };   // 8 + 4 + pad = 16
```

虚表在 **类** 上共享，对象里只有 vptr。  
多继承：每个有虚函数的基类一块，可能多个 vptr。  
钻石 + 虚继承：公共基类只留一份。

**构造里调虚函数：不会发生多态**（基类构造时派生部分未就绪）。析构同样。

---

## 4. new / delete / 内存分区

| 区 | 内容 |
|----|------|
| 栈 | 局部、调用帧，自动释放 |
| 堆 | `new` / `malloc` |
| 全局/静态 | 静态变量、全局，程序全程 |
| 常量 | 字面量等（实现定义） |
| 代码 | 指令 |

| | `new/delete` | `malloc/free` |
|---|--------------|---------------|
| 类型 | 有类型，调构造/析构 | 只分配字节 |
| 失败 | 抛 `bad_alloc`（或 nothrow） | 返回 NULL |
| 配对 | `new`↔`delete`，`new[]`↔`delete[]` | 配对 free |
| 混用 | **未定义行为** | — |

`delete nullptr` 安全。`delete` 后立刻置空。

---

## 5. 面向对象与虚函数

### 5.1 三种多态

- 编译期：重载、模板、默认参数
- 运行期：虚函数（基类指针/引用 → 派生对象）

通过 **值** 传基类会 **切片**，虚函数按基类走，且丢失派生成员。

### 5.2 虚表过程（选择默写）

1. 带虚函数的类有一张 vtable，存虚函数地址
2. 对象头部有 vptr 指向自己类的表
3. 派生重写：派生表对应槽换成新地址
4. 调用：`p->f()` → 查 `p->vptr[index]`，运行期才知道

`virtual` 析构：**基类指针 delete 派生对象必须虚析构**，否则只调基析构 → 泄漏/UB。

纯虚 `virtual void f() = 0;` → 抽象类，不能实例化。可以有虚函数体。  
析构可以纯虚，但必须有函数体。

`override`（C++11）明确重写，签错编译失败。`final` 禁止再重写/继承。

### 5.3 构造 / 析构顺序

构造：虚基类 → 基类（声明序）→ 成员（声明序）→ 自己构造体  
析构：**相反**

成员初始化用初始化列表，按 **声明顺序** 不按列表顺序（坑题）。

### 5.4 拷贝与移动（Rule of 5）

若类需要自定义其中之一，通常五个都要考虑：

1. 析构  
2. 拷贝构造  
3. 拷贝赋值  
4. 移动构造  
5. 移动赋值  

浅拷贝：只拷指针 → 双 delete。深拷贝：拷资源。  
`= default` / `= delete`。

```cpp
class T {
    T(const T&);            // 拷贝构造
    T& operator=(const T&); // 拷贝赋值
    T(T&&);                 // 移动构造
    T& operator=(T&&);
};
```

返回局部 `T` 会移动/RVO，不要 `return std::move(local)` 妨碍优化（常考点）。

---

## 6. 四种转换

| 转换 | 用途 | 风险 |
|------|------|------|
| `static_cast` | 相关类型、void*、上行转换 | 下行不检查 |
| `dynamic_cast` | 多态下行，指针失败 nullptr，引用抛 `bad_cast` | 要虚函数，有开销 |
| `const_cast` | 去/加 const | 对真常量改是 UB |
| `reinterpret_cast` | 比特级乱转指针 | 最危险 |

C 风格 `(T)x` 什么都可能，笔试答案一般是「不如具名 cast 安全」。

---

## 7. STL（选择 + 机试都考）

### 7.1 容器对照

| 容器 | 底层 | 随机访问 | 插入 | 查找 | 失效要点 |
|------|------|----------|------|------|----------|
| `vector` | 动态数组 | O(1) | 尾均摊 O(1)，中 O(n) | — | **扩容：全部失效** |
| `deque` | 分块数组 | O(1) | 头尾 O(1) | — | 插入使部分失效 |
| `list` | 双向链表 | 无 | 已知位置 O(1) | O(n) | 只有被删节点失效 |
| `array` | 定长 | O(1) | — | — | — |
| `map`/`set` | 红黑树 | 无 | O(log n) | O(log n) | 插入不使迭代器失效，删只失效被删 |
| `unordered_map/set` | 哈希 | 无 | O(1)均摊 | O(1) | **rehash 可能全失效** |
| `priority_queue` | 堆（默认大顶，vector） | 只能 top | O(log n) | — | 无迭代器 |

`vector` 扩容：容量不足时分配更大（常 2 倍）、搬旧元素、释放旧缓冲。`reserve` 可避免。

`map` 有序、键唯一；`multimap` 可重复；`unordered_*` 无序、需哈希。  
键是 `const`，不能改 key（先删再插）。

### 7.2 迭代器失效（送命题）

```cpp
vector<int> v{1,2,3};
for (auto it = v.begin(); it != v.end(); ++it)
    if (*it == 2) v.erase(it); // 错：it 已失效
// 正确：
for (auto it = v.begin(); it != v.end(); )
    if (*it == 2) it = v.erase(it);
    else ++it;
```

`vector::push_back` 若扩容，**所有指针/迭代器/引用失效**。  
遍历 `unordered_map` 时插入可能 rehash，不要边插边用旧迭代器。

### 7.3 算法头

`sort` 平均 O(n log n)，要随机访问迭代器（vector/deque，**list 用 `list::sort`**）。  
`stable_sort` 稳。`nth_element` 找第 k。  
比较器：严格弱序，不能用 `<=`（会 UB）。

---

## 8. 智能指针与 RAII

RAII：资源在对象构造获取、析构释放。锁、文件、内存都靠它。

| 类型 | 所有权 | 拷贝 | 典型用途 |
|------|--------|------|----------|
| `unique_ptr` | 独占 | 不可拷贝，可移动 | 默认首选 |
| `shared_ptr` | 共享，控制块引用计数 | 可拷贝 | 共享所有权 |
| `weak_ptr` | 不增加强引用 | 可拷贝 | 破环、观察 |

`shared_ptr` 循环引用（A↔B）计数永远 >0 → 泄漏，一侧改 `weak_ptr`。  
`make_shared` 一次分配对象+控制块，比 `shared_ptr(new T)` 好。  
`unique_ptr` 数组用 `unique_ptr<T[]>`。  
不要多个 `shared_ptr` 从同一裸 `new` 构造（控制块各一份 → 双删）。

---

## 9. 模板、const、explicit、其它

- 模板：编译期多态，每个类型实例一份代码
- 函数模板可重载；特化：全特化 / 偏特化（类模板）
- `explicit` 构造：禁止隐式转换，`explicit T(int)` 不能 `T x = 1`
- `mutable`：const 成员函数里可改该成员（如缓存）
- `static` 成员：所有对象共享，类外定义
- `this` 是指针；const 成员函数里是 `const T*`
- 友元：破封装，不是成员，无 this
- 默认参数：声明里写，定义不要重复；虚函数默认参数按 **静态类型**（坑）

```cpp
struct B { virtual void f(int x = 1); };
struct D : B { void f(int x = 2) override; };
B* p = new D;
p->f(); // 调 D::f，但默认参数是 1
```

---

## 10. 左值右值（现代 C++ 选择）

- 左值：有名字、能取地址
- 右值：临时、将亡
- `T&&` 右值引用，绑临时，用于移动
- `std::move` **不移动**，只是转成右值
- 万能引用 `T&&` 在模板里会折叠；配合 `forward` 完美转发

---

## 11. 输出题套路（每天默两道）

**虚调用：**

```cpp
struct A { virtual void f() { cout << "A"; } void g() { cout << "a"; } };
struct B : A { void f() { cout << "B"; } void g() { cout << "b"; } };
A* p = new B;
p->f(); p->g(); // Ba
A a = *p; a.f(); // A 切片
```

**析构非虚：**

```cpp
struct A { ~A() { cout << "A"; } };
struct B : A { ~B() { cout << "B"; } };
A* p = new B;
delete p; // 只打 A，UB
```

**拷贝：**

```cpp
struct S {
    int* p;
    S(int x) : p(new int(x)) {}
};
S a(1), b = a; // 浅拷，析构双删
```

**sizeof 指针 vs 数组：** 见 §1。

**i++ / ++i：** `++i` 返回左值；表达式里混用同一变量且无序列点 → UB（C++17 部分收紧，选择仍当雷）。

---

## 12. 易错选择

**Q1.** 基类指针 delete 派生对象，基类析构必须怎样？  
**A.** 虚析构。

**Q2.** 空类 sizeof？有一个虚函数的空类（64 位）？  
**A.** 1；通常 8（vptr）。

**Q3.** `vector` 在 `size==capacity` 时 `push_back`，旧迭代器？  
**A.** 全部失效。

**Q4.** `map` 和 `unordered_map` 复杂度？谁有序？  
**A.** log n vs 均摊 O(1)；map 有序。

**Q5.** `shared_ptr` 循环引用怎么破？  
**A.** 一侧 `weak_ptr`。

**Q6.** `dynamic_cast` 要求？指针失败返回？  
**A.** 多态类型（有虚函数）；nullptr。

**Q7.** `new[]` 用 `delete`？  
**A.** UB，必须 `delete[]`。

**Q8.** 构造函数里调虚函数走派生吗？  
**A.** 不，走当前正在构造的类。

**Q9.** `sizeof(指针)` 和 `sizeof(数组)`？  
**A.** 指针固定宽；数组名是整个数组。

**Q10.** 引用能绑空吗？能改绑吗？  
**A.** 都不能（正常用法）。

**Q11.** `explicit` 干什么？  
**A.** 禁止单参构造隐式转换。

**Q12.** 虚函数默认参数按谁？  
**A.** 静态类型（指针声明的那个类）。

**Q13.** `sort` 能直接排 `list` 吗？  
**A.** `std::sort` 需要随机访问，用 `list.sort()`。

**Q14.** `malloc` 出来的内存会调构造吗？  
**A.** 不会。

**Q15.** 返回局部变量的指针/引用？  
**A.** 悬空，UB。

---

## 13. 速记口诀

```
数组 sizeof 是整块，指针 sizeof 是 8（64 位）。
值传基类会切片；虚调用必须指针或引用。
基类析构要 virtual；构造里虚函数不多态。
vector 扩容全失效；erase 要用返回的 it。
map 树 log n 有序；unordered 哈希均摊 1。
unique 独占，shared 计数，weak 破环。
new 配 delete，new[] 配 delete[]，别跟 malloc 混。
static_cast 常规，dynamic_cast 下行要多态，
const_cast 去常量，reinterpret 最危险。
Rule of 5：析构/拷贝/移动五件套。
```
