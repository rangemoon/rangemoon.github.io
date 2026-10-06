---
layout: post
title: 字符串
date: 2026-10-06 16:35:00 +0800
last_modified_at: 2026-10-06 16:35:00 +0800
---

## 字符串
1. 覆盖原地修改、局部反转、模式匹配和周期性判断
2. 注意字符数组边界、额外空间限制和KMP前缀表的定义

### 1. 344 反转字符串
- 编写一个函数，其作用是将输入的字符串反转过来
    ```cpp
    void reverseString(vector<char>& s) {
        for (int i = 0, j = s.size() - 1; i < s.size() / 2; i++, j--) {
            swap(s[i], s[j]);
        }
    }

    void swap(char ch1, char ch2) {
        ch1 ^= ch2;
        ch2 ^= ch1;
        ch1 ^= ch2;
    }
    ```

### 2. 541 反转字符串 2(模拟)
- 给定一个字符串 s 和一个整数 k，从字符串开头算起，每计数至 2k 个字符，就反转这 2k 字符中的前 k 个字符，再重新计数。
    - 如果剩余字符少于 k 个，则将剩余字符全部反转。
    - 如果剩余字符小于 2k 但大于或等于 k 个，则反转前 k 个字符，其余字符保持原样。
    ```cpp
    string reverseStr(string s, int k) {
        int n = s.length(), pos = 0;
        while (pos < n) {
            if (pos + k < n) {
                reverse(s.begin() + pos, s.begin() + pos + k);
            } else {
                reverse(s.begin() + pos, s.end());
            }
            pos += 2 * k;
        }
        return s;
    }
    ```

### 3. 54 替换数字
- 给定一个字符串 s，它包含小写字母和数字字符，请编写一个函数，将字符串中的字母字符保持不变，而将每个数字字符替换为number。例如，对于输入字符串 "a1b2c3"，函数应该将其转换为 "anumberbnumbercnumber"
    ```cpp
    #include <iostream>
    using namespace std;

    int main() {
        string s; cin >> s;
        string res;
        for (char ch : s) {
            if (ch >= 'a' && ch <= 'z') {
                res += ch;
            } else if (ch >= '0' && ch <= '9') {
                res += "number";
            }
        }
        cout << res << "\n";
        return 0;
    }
    ```