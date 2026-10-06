---
layout: post
title: 哈希表
date: 2026-10-06 13:19:00 +0800
last_modified_at: 2026-10-06 16:35:00 +0800
---

## 哈希表的理论基础
1. 哈希表是根据关键码的值而直接访问的数据结构。一般哈希表都是用来快速判断一个元素是否出现在集合中

## 哈希冲突
1. 关键码映射缩影到相同的下标
2. 解决哈希冲突
- 拉链法
- 线性探测法

## 常见的三种哈希结构
1. 当我们想用哈希法来解决问题时，我们会采用以下三种数据结构
- 数组
- set(集合)
- map(映射)
2. 在c++中，set和map的底层如下

集合 | 底层实现 | 是否有序 | 数值是否可以重复 | 能否更改数值 | 查询效率 | 增删效率 |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
std::set | 红黑树 | 有序 | 否 | 否 | O(logn) | O(logn) |
std::multiset | 红黑树 | 有序 | 是 | 否 | O(logn) | O(logn) |
std::unordered_set | 哈希表 | 无序 | 否 | 否 | O(1) | O(1) |
std::map | 红黑树 | key有序 | key不可重复 | key不可修改 | O(logn) | O(logn) |
std::multimap | 红黑树 | key有序 | key可重复 | key不可修改 | O(logn) | O(logn) |
std::unordered_map | 哈希表 | key无序 | key不可重复 | key不可修改 | O(1) | O(1) |

## leetcode
### 1. 242 有效的字母异位词
- 给定两个字符串 s 和 t ，编写一个函数来判断 t 是否是 s
    ```cpp
    bool isAnagram(string s, string t) {
        // hash map
        if (s.length() != t.length()) return false;
        vector<int> table(26, 0);
        for (char ch : s) table[ch - 'a']++;
        for (char ch : t) {
            table[ch - 'a']--;
            if (table[ch - 'a'] < 0) return false;
        }
        return true;
    }
    ```

### 2. 49 字母异位词分组
- 给你一个字符串数组，请你将 字母异位词 组合在一起。可以按任意顺序返回结果列表。
    ```cpp
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        unordered_map<string, vector<string>> stringMap;
        for (string str : strs) {
            string ket_string = str;
            sort(ket_string.begin(), ket_string.end());
            stringMap[ket_string].emplace_back(str);
        }
        vector<vector<string>> res;
        for (auto it = stringMap.begin(); it != stringMap.end(); ++it) {
            res.emplace_back(it->second);
        }
        return res;
    }
    ```

### 3. 438 找到字符串中所有的字母异位词
- 给定两个字符串 s 和 p，找到 s 中所有 p 的 异位词 的子串，返回这些子串的起始索引。不考虑答案输出的顺序
    ```cpp
    vector<int> findAnagrams(string s, string p) {
        unordered_map<char, int> charMap;
        vector<int> ans;
        for (char ch : p) {
            charMap[ch]++;
        }
        int slow = 0, fast = 0, missing = p.length();
        for (int fast = 0; fast < s.length(); ++fast) {
            if (charMap[s[fast]] > 0) {
                missing--;
            }
            charMap[s[fast]]--;
            // 窗口满 n 后收缩左指针
            if (fast >= p.length()) {
                if (charMap[s[slow]] >= 0) missing++; // 移走的是 p 需要的字符
                charMap[s[slow]]++;
                slow++;
            }
            if (missing == 0) ans.push_back(slow);
        }
        return ans;
    }
    ```

### 4. 383 赎金信
- 给你两个字符串：ransomNote 和 magazine ，判断 ransomNote 能不能由 magazine 里面的字符构成。如果可以，返回 true ；否则返回 false 。
    ```cpp
    bool canConstruct(string ransomNote, string magazine) {
        vector<int> charMap(26, 0);
        for (char ch : magazine) {
            charMap[ch - 'a']++;
        }
        for (char ch : ransomNote) {
            charMap[ch - 'a']--;
            if (charMap[ch - 'a'] < 0) return false;
        }
        return true;
    }
    ```

### 5. 349 两个数组的交集
- 给定两个数组，编写一个函数来计算它们的交集。
    ```cpp
    vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {
        vector<int> res;
        unordered_map<int, int> numMap;
        for (int num : nums1) {
            numMap[num] = 1;
        }
        for (int num : nums2) {
            if (numMap[num] == 1) {
                res.push_back(num);
                numMap[num] = 0;
            }
        }
        return res;
    }
    ```

### 6. 350 两个数组的交集 II
- 给你两个整数数组 nums1 和 nums2 ，请你以数组形式返回两数组的交集。返回结果中每个元素出现的次数，应与元素在两个数组中都出现的次数一致（如果出现次数不一致，则考虑取较小值）。可以不考虑输出结果的顺序。
    ```cpp
    vector<int> intersect(vector<int>& nums1, vector<int>& nums2) {
        vector<int> res;
        unordered_map<int, int> numMap;
        for (int num : nums1) {
            numMap[num]++;
        }
        for (int num : nums2) {
            numMap[num]--;
            if (numMap[num] >= 0) {
                res.push_back(num);
            }
        }
        return res;
    }
    ```

### 7. 202 快乐数
- 编写一个算法来判断一个数 n 是不是快乐数。
    ```cpp
    bool isHappy(int n) {
        unordered_set<int> set;
        while (1) {
            int sum = getSum(n);
            if (sum == 1) return true;
            if (set.find(sum) != set.end()) {
                return false;
            } else {
                set.insert(sum);
            }
            n = sum;
        }
    }

    int getSum(int n) {
        int sum = 0;
        while (n) {
            sum += (n % 10) * (n % 10);
            n /= 10;
        }
        return sum;
    }
    ```
