---
layout: post
title: 回溯
date: 2026-09-29 12:08:00 +0800
last_modified_at: 2026-09-29 18:40:00 +0800
categories: 算法
---

## 回溯的概念
1. 回溯法也叫回溯搜索法，是一种搜索方式
- 回溯是递归的副产品，只要有递归就会有回溯
- 回溯的本质是穷举，穷举所有可能，然后选出我们想要的答案
- 如果想让回溯法高效一些，可以加一些剪枝的操作，但也改不了回溯法就是穷举的本质。

## 回溯法解决的问题
回溯法，一般可以解决如下几种问题：
- 组合问题：N个数里面按一定规则找出k个数的集合
- 排列问题：N个数按一定规则全排列，有几种排列方式
- 切割问题：一个字符串按一定规则有几种切割方式
- 子集问题：一个N个数的集合里有多少符合条件的子集
- 棋盘问题：N皇后，解数独等等

## 如何理解回溯法
1. 回溯法解决的问题都可以抽象为树形结构，是所有回溯法的问题都可以抽象为树形结构！
   - 因为回溯法解决的都是在集合中递归查找子集，集合的大小就构成了树的宽度，递归的深度就构成了树的深度。
   - 递归就要有终止条件，所以必然是一棵高度有限的树（N叉树）。

## 伪代码
```
void backtracking(参数) {
    if (终止条件) {
        存放结果;
        return;
    }
    for (选择：本层集合中的元素(树中节点孩子的数量就是集合的大小)) {
        处理节点；
        backtracking(路径，选择列表); // 递归
        回溯，撤销处理结果
    }
}
```
## 回溯问题
### 一、组合

1. leetcode 77. 组合

```cpp
class Solution {
public:
    vector<vector<int>> combine(int n, int k) {
        backtracking(n, k, 1);
        return res;
    }

    void backtracking(int n, int k, int startIndex) {
        if (path.size() == k) {
            res.push_back(path);
            return;
        }
        // for (int i = startIndex; i <= n; ++i) {
        for (int i = statyIndex; i <= n - (k - path.size()) + 1; ++i) {
            path.push_back(i);
            backtracking(n, k, i + 1);
            path.pop_back();
        }
    }

private:
    vector<vector<int>> res;
    vector<int> path;
}
```

2. leetcode 40. 组合总和2

```cpp
class Solution{
public:
    vector<vector<int>> combinationSum2(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        backtracking(candidates, 0, target, 0);
        return res;
    }

    void backtracking(vector<int>& candidates, int startIndex, int targetSum, int sum) {
        if (sum == targetSum) {
            res.push_back(path);
            return;
        }
        for (int i = startIndex; i < candidates.size(); ++i) {
            if (i > startIndex && candidates[i] == candidates[i - 1]) {
                continue;
            }

            sum += candidates[i];
            path.push_back(candidates[i]);

            if (sum > targetSum) {
                sum -= candidates[i];
                path.pop_back();
                return;
            }

            backtracking(candidates, i + 1, targetSum, sum);
            sum -= candidates[i];
            path.pop_back();
        }
    }
private:
    vector<int> path;
    vector<vector<int>> res;
};
```

3. leetcode 216. 组合总和3

```cpp
class Solution {
public:
    vector<vector<int>> combinationSum3(int k, int n) {
        backtracking(n, k, 0, 1);
        return res;
    }

    void backtracking(int targetSum, int k, int sum, int startIndex) {
        if (path.size() == k) {
            if (sum == targetSum) res.push_back(path);
            return;
        }
        for (int i = startIndex; i <= 9; ++i) {
            sum += i;
            path.push_back(i);

            if (sum > targetSum) { // 剪枝操作
                sum -= i; // 剪枝之前先把回溯做了
                path.pop_back(); // 剪枝之前先把回溯做了
                return;
            }

            backtracking(targetSum, k, sum, i + 1);

            sum -= i;
            path.pop_back();
        }
    }
private:
    vector<vector<int>> res;
    vector<int> path;
};
```

4. leetcode 17. 电话号码的组合

```cpp
class Solution {
public:
    vector<string> letterCombinations(string digits) {
        if (digits.length() == 0) return res;
        backtracking(digits, 0);
        return res;
    }

    void backtracking(const string& digits, int index) {
        if (index == digits.length()) {
            res.push_back(path);
            return;
        }
        int digit = digits[index] - '0';
        string letters = letterMap[digit];
        for (int i = 0; i < letters.length(); ++i) {
            path.push_back(letters[i]);
            backtracking(digits, index + 1);
            path.pop_back();
        }
    }

private:
    string path;
    vector<string> res;
    const string letterMap[10] = {
        "", // 0
        "", // 1
        "abc", // 2
        "def", // 3
        "ghi", // 4
        "jkl", // 5
        "mno", // 6
        "pqrs", // 7
        "tuv", // 8
        "wxyz", // 9
    };
};
```